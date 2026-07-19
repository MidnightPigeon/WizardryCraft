// Applies custom TConstruct mana traits directly to Mana and Artifice casting resources.

const MinecraftForge = Java.loadClass('net.minecraftforge.common.MinecraftForge')
const EventPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const Consumer = Java.loadClass('java.util.function.Consumer')
const PlayerTickEvent = Java.loadClass('net.minecraftforge.event.TickEvent$PlayerTickEvent')
const PlayerLoggedInEvent = Java.loadClass('net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent')

const ToolStack = Java.loadClass('slimeknights.tconstruct.library.tools.nbt.ToolStack')
const ModifierId = Java.loadClass('slimeknights.tconstruct.library.modifiers.ModifierId')

const MnaPlayerMagicProvider = Java.loadClass('com.mna.capabilities.playerdata.magic.PlayerMagicProvider')
const MnaServerMessageDispatcher = Java.loadClass('com.mna.network.ServerMessageDispatcher')
const MnaCastingResourceIDs = Java.loadClass('com.mna.api.capabilities.resource.CastingResourceIDs')
const MnaGeneralConfigValues = Java.loadClass('com.mna.api.config.GeneralConfigValues')

const MAGICAL_ID = ModifierId.tryParse('kubejs:magical')
const VINTEUM_REGROWTH_ID = ModifierId.tryParse('kubejs:vinteum_regrowth')

const MNA_TCON_MAX_MANA_KEY = 'mc_magic:tconstruct_magical_max_mana'
const MNA_TCON_REGEN_KEY = 'mc_magic:tconstruct_vinteum_regrowth'
const MNA_TCON_LAST_MAX_LEVEL_KEY = 'mc_magic_tconstruct_last_max_mana_level'
const MNA_TCON_LAST_REGEN_LEVEL_KEY = 'mc_magic_tconstruct_last_regen_level'
const MNA_TCON_LAST_RESOURCE_KEY = 'mc_magic_tconstruct_last_resource'
const MNA_BASE_REGEN_MULTIPLIER = 1
const VINTEUM_REGEN_PER_LEVEL = 0.10
const MNA_SYNC_CASTING_RESOURCE = 1

function getPlayerMagic(player) {
  if (player == null) {
    return null
  }

  return player.getCapability(MnaPlayerMagicProvider.MAGIC).orElse(null)
}

function getTconstructModifierLevel(stack, modifierId) {
  if (stack == null || stack.isEmpty()) {
    return 0
  }

  try {
    return ToolStack.from(stack).getModifiers().getLevel(modifierId)
  } catch (ignored) {
    return 0
  }
}

function addHeldAndArmorStacks(player, stacks) {
  stacks.push(player.getMainHandItem())
  stacks.push(player.getOffhandItem())

  const armor = player.getArmorSlots().iterator()
  while (armor.hasNext()) {
    stacks.push(armor.next())
  }
}

function getEquippedTconstructManaLevels(player) {
  const stacks = []
  addHeldAndArmorStacks(player, stacks)

  let maxManaLevel = 0
  let regenLevel = 0
  stacks.forEach(stack => {
    maxManaLevel += getTconstructModifierLevel(stack, MAGICAL_ID)
    regenLevel += getTconstructModifierLevel(stack, VINTEUM_REGROWTH_ID)
  })

  return {
    maxManaLevel: maxManaLevel,
    regenLevel: regenLevel
  }
}

function forceMnaResourceSync(player, magic) {
  magic.forceSync(MNA_SYNC_CASTING_RESOURCE)
  MnaServerMessageDispatcher.sendMagicSyncMessage(player)
}

function isSleepingPlayer(player) {
  try {
    return player.isSleeping()
  } catch (ignored) {
    return player.m_5803_()
  }
}

function isSoulsResource(resource) {
  return resource != null && resource.getRegistryName().equals(MnaCastingResourceIDs.SOULS)
}

function isColdDarkResting(player) {
  return isSleepingPlayer(player) || player.getPersistentData().contains('coldDarkPos')
}

function restoreSoulsWhileResting(player, resource, regenLevel) {
  if (regenLevel <= 0 || !isSoulsResource(resource) || !isColdDarkResting(player) || resource.getAmount() >= resource.getMaxAmount()) {
    return false
  }

  const regenMultiplier = MNA_BASE_REGEN_MULTIPLIER + (regenLevel * VINTEUM_REGEN_PER_LEVEL)
  const rate = Math.max(1, MnaGeneralConfigValues.TotalManaRegenTicks * (MNA_BASE_REGEN_MULTIPLIER / regenMultiplier))
  resource.restore(resource.getMaxAmount() / rate)
  resource.setNeedsSync()
  return true
}

function syncTconstructManaModifiers(player) {
  const magic = getPlayerMagic(player)
  if (magic == null) {
    return
  }

  let needsSync = false

  const resource = magic.getCastingResource()
  if (resource == null) {
    return
  }

  const levels = getEquippedTconstructManaLevels(player)
  const persistentData = player.getPersistentData()
  const resourceId = resource.getRegistryName().toString()
  const levelChanged = persistentData.getInt(MNA_TCON_LAST_MAX_LEVEL_KEY) != levels.maxManaLevel ||
    persistentData.getInt(MNA_TCON_LAST_REGEN_LEVEL_KEY) != levels.regenLevel ||
    persistentData.getString(MNA_TCON_LAST_RESOURCE_KEY) != resourceId

  const maxManaBonus = levels.maxManaLevel * 10
  if (maxManaBonus > 0) {
    resource.addModifier(MNA_TCON_MAX_MANA_KEY, maxManaBonus)
  } else {
    resource.removeModifier(MNA_TCON_MAX_MANA_KEY)
  }

  if (levels.regenLevel > 0) {
    const regenMultiplier = MNA_BASE_REGEN_MULTIPLIER + (levels.regenLevel * VINTEUM_REGEN_PER_LEVEL)
    resource.addRegenerationModifier(MNA_TCON_REGEN_KEY, (MNA_BASE_REGEN_MULTIPLIER / regenMultiplier) - 1)
  } else {
    resource.removeRegenerationModifier(MNA_TCON_REGEN_KEY)
  }

  persistentData.putInt(MNA_TCON_LAST_MAX_LEVEL_KEY, levels.maxManaLevel)
  persistentData.putInt(MNA_TCON_LAST_REGEN_LEVEL_KEY, levels.regenLevel)
  persistentData.putString(MNA_TCON_LAST_RESOURCE_KEY, resourceId)

  needsSync = restoreSoulsWhileResting(player, resource, levels.regenLevel) || needsSync || levelChanged
  if (needsSync) {
    forceMnaResourceSync(player, magic)
  }
}

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.NORMAL,
  false,
  PlayerLoggedInEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      syncTconstructManaModifiers(event.getEntity())
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
        syncTconstructManaModifiers(event.player)
      }
    }
  })
)

console.info('MC Magic MNA/TConstruct mana modifier bridge loaded.')
