BlockEvents.modification(event => {
  function LightDefine(blockname, lightlevel) {
    event.modify(blockname, block => {
      block.lightEmission = lightlevel
    })
  }

  LightDefine('kubejs:liquid_cincinnasite', 10)
  LightDefine('kubejs:liquid_thallasium', 10)
  LightDefine('kubejs:liquid_terminite', 15)
})
