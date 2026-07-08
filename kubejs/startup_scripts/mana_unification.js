// Unify Iron's Spells mana usage onto Mana and Artifice's mana resource.
// Iron's internal mana is kept as a server-side mirror so its own cast checks still work.

const MinecraftForge = Java.loadClass('net.minecraftforge.common.MinecraftForge')
const EventPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const Consumer = Java.loadClass('java.util.function.Consumer')

const IronAttributes = Java.loadClass('io.redspace.ironsspellbooks.api.registry.AttributeRegistry')
const IronMagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData')
const IronSyncManaPacket = Java.loadClass('io.redspace.ironsspellbooks.network.SyncManaPacket')
const IronPacketDistributor = Java.loadClass('io.redspace.ironsspellbooks.setup.PacketDistributor')
const IronChangeManaEvent = Java.loadClass('io.redspace.ironsspellbooks.api.events.ChangeManaEvent')
const IronSpellPreCastEvent = Java.loadClass('io.redspace.ironsspellbooks.api.events.SpellPreCastEvent')
const IronSpellOnCastEvent = Java.loadClass('io.redspace.ironsspellbooks.api.events.SpellOnCastEvent')
const PlayerTickEvent = Java.loadClass('net.minecraftforge.event.TickEvent$PlayerTickEvent')
const PlayerLoggedInEvent = Java.loadClass('net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent')

const MnaPlayerMagicProvider = Java.loadClass('com.mna.capabilities.playerdata.magic.PlayerMagicProvider')

const MANA_BRIDGE_MAX_KEY = 'mc_magic:irons_spellbooks_max_mana'
const MANA_BRIDGE_REGEN_KEY = 'mc_magic:irons_spellbooks_mana_regen'
const MNA_BASE_MANA = 100
const MNA_BASE_REGEN_MULTIPLIER = 1
const MNA_SYNC_CASTING_RESOURCE = 1
let syncingIronMana = false

function getPlayerMagic(player) {
  if (player == null) {
    return null
  }

  return player.getCapability(MnaPlayerMagicProvider.MAGIC).orElse(null)
}

function getMnaResource(player) {
  const magic = getPlayerMagic(player)
  if (magic == null) {
    return null
  }

  return magic.getCastingResource()
}

function forceMnaResourceSync(player) {
  const magic = getPlayerMagic(player)
  if (magic != null) {
    magic.forceSync(MNA_SYNC_CASTING_RESOURCE)
  }
}

function getAttributeValue(entity, attributeRegistryObject) {
  const attribute = attributeRegistryObject.get()
  try {
    return entity.getAttributeValue(attribute)
  } catch (ignored) {
    return entity.m_21133_(attribute)
  }
}

function syncIronMana(player, resource) {
  const ironMagic = IronMagicData.getPlayerMagicData(player)
  const target = resource.getAmount()
  if (Math.abs(ironMagic.getMana() - target) > 0.01) {
    syncingIronMana = true
    try {
      ironMagic.setMana(target)
      IronPacketDistributor.sendToPlayer(player, new IronSyncManaPacket(ironMagic))
    } finally {
      syncingIronMana = false
    }
  }
}

function syncMnaModifiers(player, resource) {
  const ironMax = getAttributeValue(player, IronAttributes.MAX_MANA)
  const maxBonus = Math.max(0, ironMax - MNA_BASE_MANA)
  resource.addModifier(MANA_BRIDGE_MAX_KEY, maxBonus)

  const ironRegen = getAttributeValue(player, IronAttributes.MANA_REGEN)
  const regenBonus = Math.max(0, ironRegen - MNA_BASE_REGEN_MULTIPLIER)
  resource.addRegenerationModifier(MANA_BRIDGE_REGEN_KEY, regenBonus)
}

function syncPlayerManaSystems(player) {
  const magic = getPlayerMagic(player)
  if (magic == null) {
    return
  }

  if (!magic.isMagicUnlocked()) {
    magic.unlockMagic()
    magic.forceSync()
  }

  const resource = magic.getCastingResource()
  if (resource == null) {
    return
  }

  syncMnaModifiers(player, resource)
  syncIronMana(player, resource)
}

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.NORMAL,
  false,
  PlayerLoggedInEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      syncPlayerManaSystems(event.getEntity())
    }
  })
)

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.NORMAL,
  false,
  PlayerTickEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      if (String(event.side) == 'SERVER' && String(event.phase) == 'END') {
        syncPlayerManaSystems(event.player)
      }
    }
  })
)

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.HIGHEST,
  false,
  IronChangeManaEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      if (syncingIronMana) {
        return
      }

      const player = event.getEntity()
      const resource = getMnaResource(player)
      if (resource == null) {
        return
      }

      syncMnaModifiers(player, resource)

      const oldMana = event.getOldMana()
      const newMana = event.getNewMana()
      const delta = newMana - oldMana

      if (Math.abs(delta) <= 0.01) {
        event.setNewMana(resource.getAmount())
        return
      }

      if (delta < 0) {
        const cost = -delta
        if (!resource.hasEnough(player, cost)) {
          event.setCanceled(true)
          syncIronMana(player, resource)
          return
        }

        resource.consume(player, cost)
      } else {
        resource.restore(delta)
      }

      resource.setNeedsSync()
      forceMnaResourceSync(player)
      event.setNewMana(resource.getAmount())
    }
  })
)

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.HIGHEST,
  false,
  IronSpellPreCastEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      const player = event.getEntity()
      const resource = getMnaResource(player)
      if (resource == null) {
        return
      }

      syncMnaModifiers(player, resource)
      syncIronMana(player, resource)
    }
  })
)

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.LOWEST,
  false,
  IronSpellOnCastEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      const source = event.getCastSource()
      if (source == null || !source.consumesMana()) {
        return
      }

      const player = event.getEntity()
      const resource = getMnaResource(player)
      if (resource == null) {
        return
      }

      const cost = event.getManaCost()
      if (cost > 0) {
        if (!resource.hasEnough(player, cost)) {
          syncIronMana(player, resource)
          return
        }

        resource.consume(player, cost)
        resource.setNeedsSync()
        forceMnaResourceSync(player)
      }

      event.setManaCost(0)
      syncIronMana(player, resource)
    }
  })
)

console.info('MC Magic mana unification bridge loaded: Iron mana now mirrors and spends MNA mana.')
