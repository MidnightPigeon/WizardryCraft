// Let Iron's Spells spell power attributes enhance Mana and Artifice spell parts.
// The highest Iron spell power multiplier is applied equally to MNA DAMAGE and DURATION.
const MnaSpellAttribute = Java.loadClass('com.mna.api.spells.attributes.Attribute')
const IronSpellAttributes = Java.loadClass('io.redspace.ironsspellbooks.api.registry.AttributeRegistry')

const MNA_IRON_SPELL_POWER_APPLIED_KEY = 'mc_magic:iron_spell_power_applied'

const IRON_SPELL_POWER_ATTRIBUTES = [
  IronSpellAttributes.SPELL_POWER,
  IronSpellAttributes.FIRE_SPELL_POWER,
  IronSpellAttributes.ICE_SPELL_POWER,
  IronSpellAttributes.LIGHTNING_SPELL_POWER,
  IronSpellAttributes.HOLY_SPELL_POWER,
  IronSpellAttributes.ENDER_SPELL_POWER,
  IronSpellAttributes.BLOOD_SPELL_POWER,
  IronSpellAttributes.EVOCATION_SPELL_POWER,
  IronSpellAttributes.NATURE_SPELL_POWER,
  IronSpellAttributes.ELDRITCH_SPELL_POWER
]

function getBridgeAttributeValue(entity, attributeRegistryObject) {
  if (entity == null || attributeRegistryObject == null) {
    return 1
  }

  const attribute = attributeRegistryObject.get()
  try {
    return entity.getAttributeValue(attribute)
  } catch (ignored) {
    return entity.m_21133_(attribute)
  }
}

function getHighestIronSpellPower(entity) {
  let multiplier = 1
  IRON_SPELL_POWER_ATTRIBUTES.forEach(attributeRegistryObject => {
    const value = getBridgeAttributeValue(entity, attributeRegistryObject)
    if (Number.isFinite(value) && value > multiplier) {
      multiplier = value
    }
  })
  return multiplier
}

function scaleMnaPartAttribute(modifiedPart, attribute, multiplier) {
  if (modifiedPart == null) {
    return false
  }

  try {
    if (!modifiedPart.getContainedAttributes().contains(attribute)) {
      return false
    }

    const currentMultiplier = modifiedPart.getMultiplier(attribute)
    return modifiedPart.setMultiplier(attribute, currentMultiplier * multiplier)
  } catch (ignored) {
    return false
  }
}

function applyIronSpellPowerToMnaSpell(caster, spell, context) {
  if (caster == null || spell == null || context == null) {
    return
  }

  const meta = context.getMeta()
  if (meta.getBoolean(MNA_IRON_SPELL_POWER_APPLIED_KEY)) {
    return
  }

  const multiplier = getHighestIronSpellPower(caster)
  if (multiplier <= 1.0001) {
    return
  }

  let changed = false
  changed = scaleMnaPartAttribute(spell.getShape(), MnaSpellAttribute.DURATION, multiplier) || changed

  for (let i = 0; i < spell.countComponents(); i++) {
    const component = spell.getComponent(i)
    changed = scaleMnaPartAttribute(component, MnaSpellAttribute.DAMAGE, multiplier) || changed
    changed = scaleMnaPartAttribute(component, MnaSpellAttribute.DURATION, multiplier) || changed
  }

  if (changed) {
    meta.putBoolean(MNA_IRON_SPELL_POWER_APPLIED_KEY, true)
    meta.putFloat('mc_magic:iron_spell_power_multiplier', multiplier)
  }
}

SpellEvent.casted(event => {
  applyIronSpellPowerToMnaSpell(event.getEntity(), event.getSpell(), event.getContext())
})

SpellEvent.componentApplying(event => {
  const source = event.getSource()
  if (source == null || !source.hasCasterReference()) {
    return
  }

  applyIronSpellPowerToMnaSpell(source.getCaster(), event.getContext().getSpell(), event.getContext())
})
