// Hide Iron's mana HUD; Mana and Artifice is the only visible mana bar.

const MinecraftForge = Java.loadClass('net.minecraftforge.common.MinecraftForge')
const EventPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const Consumer = Java.loadClass('java.util.function.Consumer')
const RenderGuiOverlayPreEvent = Java.loadClass('net.minecraftforge.client.event.RenderGuiOverlayEvent$Pre')

MinecraftForge.EVENT_BUS.addListener(
  EventPriority.HIGHEST,
  false,
  RenderGuiOverlayPreEvent,
  new JavaAdapter(Consumer, {
    accept: event => {
      const overlayId = event.getOverlay().id().toString()
      if (overlayId == 'irons_spellbooks:mana_overlay') {
        event.setCanceled(true)
      }
    }
  })
)

console.info('MC Magic mana unification client bridge loaded: Iron mana overlay hidden.')
