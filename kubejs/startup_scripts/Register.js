StartupEvents.registry('block', event => {
})

StartupEvents.registry('item', event => {
})

StartupEvents.registry('fluid', event => {
  event.create('liquid_dark_iron')
    .thickTexture(0x303030)
    .bucketColor(0x303030)
    .displayName('Liquid Dark Iron')
    .createAttributes().dropOff(2).tickDelay(40)

  event.create('liquid_thallasium')
    .thinTexture(0xACDDE5)
    .bucketColor(0xACDDE5)
    .displayName('Liquid Thallasium')
    .createAttributes().dropOff(2).tickDelay(40)

  event.create('liquid_aeternium')
    .thickTexture(0x37946E)
    .bucketColor(0x37946E)
    .displayName('Liquid Aeternium')
    .createAttributes().dropOff(2).tickDelay(40)

  event.create('liquid_terminite')
    .thickTexture(0x4CDABB)
    .bucketColor(0x4CDABB)
    .displayName('Liquid Terminite')
    .createAttributes().dropOff(2).tickDelay(40)

  event.create('liquid_cincinnasite')
    .thinTexture(0xFFD700)
    .bucketColor(0xFFD700)
    .displayName('Liquid Cincinnasite')
    .createAttributes().dropOff(2).tickDelay(40)
})
