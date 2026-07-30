ServerEvents.recipes(event => {
  const { tconstruct } = event.recipes

  function FluidtoIngot(fluid, metal) {
    event.custom({
      type: 'tconstruct:casting_table',
      cast: { tag: 'tconstruct:casts/multi_use/ingot' },
      cooling_time: 60,
      fluid: {
        amount: 90,
        fluid: fluid
      },
      result: {
        item: metal
      }
    })
    event.custom({
      type: 'tconstruct:casting_table',
      cast: { tag: 'tconstruct:casts/single_use/ingot' },
      cooling_time: 60,
      fluid: {
        amount: 90,
        fluid: fluid
      },
      result: {
        item: metal
      }
    })
  }

  tconstruct.melting(Fluid.of('kubejs:liquid_dark_iron', 90), 'graveyard:dark_iron_ingot').temperature(800).time(60)
  tconstruct.melting(Fluid.of('kubejs:liquid_dark_iron', 810), 'graveyard:dark_iron_block').temperature(800).time(540)
  FluidtoIngot('kubejs:liquid_dark_iron', 'graveyard:dark_iron_ingot')
  event.custom({
    type: 'tconstruct:casting_basin',
    cooling_time: 200,
    fluid: {
      amount: 810,
      fluid: 'kubejs:liquid_dark_iron'
    },
    result: {
      item: 'graveyard:dark_iron_block'
    }
  })

  event.remove({ id: 'tconstruct:smeltery/melting/metal/iron/ingot' })
  tconstruct.melting(Fluid.of('tconstruct:molten_iron', 90), 'minecraft:iron_ingot').temperature(800).time(300)

  tconstruct.melting(Fluid.of('tconstruct:molten_ender', 50), 'betterend:ender_shard').temperature(477).time(60)
  tconstruct.melting(Fluid.of('tconstruct:molten_ender', 250), 'betterend:ender_ore').temperature(477).time(180)
  tconstruct.melting(Fluid.of('tconstruct:molten_ender', 1000), 'betterend:ender_block').temperature(477).time(360)

  tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 90), 'betterend:thallasium_ingot').temperature(750).time(60)
  tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 180), 'betterend:thallasium_raw').temperature(750).time(60)
  tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 270), 'betterend:thallasium_ore').temperature(750).time(120)
  tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 810), 'betterend:thallasium_block').temperature(750).time(360)
  FluidtoIngot('kubejs:liquid_thallasium', 'betterend:thallasium_ingot')
  event.custom({
    type: 'tconstruct:casting_basin',
    cooling_time: 200,
    fluid: {
      amount: 810,
      fluid: 'kubejs:liquid_thallasium'
    },
    result: {
      item: 'betterend:thallasium_block'
    }
  })

  tconstruct.melting(Fluid.of('kubejs:liquid_aeternium', 90), 'betterend:aeternium_ingot').temperature(1000).time(80)
  tconstruct.melting(Fluid.of('kubejs:liquid_aeternium', 810), 'betterend:aeternium_block').temperature(1000).time(480)
  FluidtoIngot('kubejs:liquid_aeternium', 'betterend:aeternium_ingot')
  event.custom({
    type: 'tconstruct:casting_basin',
    cooling_time: 200,
    fluid: {
      amount: 810,
      fluid: 'kubejs:liquid_aeternium'
    },
    result: {
      item: 'betterend:aeternium_block'
    }
  })

  tconstruct.melting(Fluid.of('kubejs:liquid_terminite', 90), 'betterend:terminite_ingot').temperature(1250).time(100)
  tconstruct.melting(Fluid.of('kubejs:liquid_terminite', 810), 'betterend:terminite_block').temperature(1250).time(600)
  FluidtoIngot('kubejs:liquid_terminite', 'betterend:terminite_ingot')
  event.custom({
    type: 'tconstruct:casting_basin',
    cooling_time: 200,
    fluid: {
      amount: 810,
      fluid: 'kubejs:liquid_terminite'
    },
    result: {
      item: 'betterend:terminite_block'
    }
  })

  tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 90), 'betternether:cincinnasite_ingot').temperature(700).time(60)
  tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 90), 'betternether:cincinnasite').temperature(700).time(60)
  tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 360), 'betternether:cincinnasite_forged').temperature(700).time(200)
  tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 360), 'betternether:cincinnasite_block').temperature(700).time(200)
  FluidtoIngot('kubejs:liquid_cincinnasite', 'betternether:cincinnasite_ingot')
  event.custom({
    type: 'tconstruct:casting_basin',
    cooling_time: 160,
    fluid: {
      amount: 360,
      fluid: 'kubejs:liquid_cincinnasite'
    },
    result: {
      item: 'betternether:cincinnasite_forged'
    }
  })
})
