package com.mcmagic.integration;

import com.mna.api.capabilities.IPlayerMagic;
import com.mna.api.capabilities.resource.CastingResourceIDs;
import com.mna.api.capabilities.resource.ICastingResource;
import com.mna.api.config.GeneralConfigValues;
import com.mna.capabilities.playerdata.magic.PlayerMagicProvider;
import com.mna.network.ServerMessageDispatcher;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.common.capabilities.ICapabilityProvider;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.LogicalSide;
import slimeknights.tconstruct.library.modifiers.Modifier;
import slimeknights.tconstruct.library.modifiers.ModifierId;
import slimeknights.tconstruct.library.modifiers.ModifierManager;
import slimeknights.tconstruct.library.tools.nbt.ToolStack;

public final class TinkersMnaModifiers {
  public static final ModifierId MAGICAL = new ModifierId(McMagicIntegration.MOD_ID, "magical");
  public static final ModifierId VINTEUM_REGROWTH =
      new ModifierId(McMagicIntegration.MOD_ID, "vinteum_regrowth");

  private static final String MAX_MANA_KEY = "tinkers_mna:tconstruct_magical_max_mana";
  private static final String REGEN_KEY = "tinkers_mna:tconstruct_vinteum_regrowth";
  private static final String LAST_MAX_LEVEL_KEY = "tinkers_mna_tconstruct_last_max_mana_level";
  private static final String LAST_REGEN_LEVEL_KEY = "tinkers_mna_tconstruct_last_regen_level";
  private static final String LAST_RESOURCE_KEY = "tinkers_mna_tconstruct_last_resource";
  private static final float BASE_REGEN_MULTIPLIER = 1.0F;
  private static final float VINTEUM_REGEN_PER_LEVEL = 0.10F;
  private static final int SYNC_CASTING_RESOURCE = 1;

  private TinkersMnaModifiers() {}

  public static void register(IEventBus modBus) {
    modBus.addListener(TinkersMnaModifiers::registerModifiers);
    MinecraftForge.EVENT_BUS.register(TinkersMnaModifiers.class);
  }

  private static void registerModifiers(ModifierManager.ModifierRegistrationEvent event) {
    event.registerStatic(MAGICAL, new Modifier());
    event.registerStatic(VINTEUM_REGROWTH, new Modifier());
  }

  @SubscribeEvent
  public static void onPlayerLogin(PlayerEvent.PlayerLoggedInEvent event) {
    if (event.getEntity() instanceof ServerPlayer player) {
      syncTconstructManaModifiers(player);
    }
  }

  @SubscribeEvent
  public static void onPlayerTick(TickEvent.PlayerTickEvent event) {
    if (event.side == LogicalSide.SERVER && event.phase == TickEvent.Phase.END
        && event.player instanceof ServerPlayer player) {
      syncTconstructManaModifiers(player);
    }
  }

  private static IPlayerMagic getPlayerMagic(Player player) {
    return ((ICapabilityProvider) player).getCapability(PlayerMagicProvider.MAGIC, null).orElse(null);
  }

  private static int getTconstructModifierLevel(ItemStack stack, ModifierId modifierId) {
    if (stack == null || stack.m_41619_()) {
      return 0;
    }

    try {
      return ToolStack.from(stack).getModifiers().getLevel(modifierId);
    } catch (RuntimeException ignored) {
      return 0;
    }
  }

  private static ManaLevels getEquippedTconstructManaLevels(Player player) {
    int maxManaLevel = 0;
    int regenLevel = 0;

    maxManaLevel += getTconstructModifierLevel(player.m_21205_(), MAGICAL);
    regenLevel += getTconstructModifierLevel(player.m_21205_(), VINTEUM_REGROWTH);
    maxManaLevel += getTconstructModifierLevel(player.m_21206_(), MAGICAL);
    regenLevel += getTconstructModifierLevel(player.m_21206_(), VINTEUM_REGROWTH);

    for (EquipmentSlot slot : EquipmentSlot.values()) {
      if (slot.m_20743_() == EquipmentSlot.Type.ARMOR) {
        ItemStack stack = player.m_6844_(slot);
        maxManaLevel += getTconstructModifierLevel(stack, MAGICAL);
        regenLevel += getTconstructModifierLevel(stack, VINTEUM_REGROWTH);
      }
    }

    return new ManaLevels(maxManaLevel, regenLevel);
  }

  private static void syncTconstructManaModifiers(ServerPlayer player) {
    IPlayerMagic magic = getPlayerMagic(player);
    if (magic == null) {
      return;
    }

    ICastingResource resource = magic.getCastingResource();
    if (resource == null) {
      return;
    }

    ManaLevels levels = getEquippedTconstructManaLevels(player);
    CompoundTag persistentData = player.m_36331_();
    String resourceId = resource.getRegistryName().toString();
    boolean levelChanged = persistentData.m_128451_(LAST_MAX_LEVEL_KEY) != levels.maxManaLevel
        || persistentData.m_128451_(LAST_REGEN_LEVEL_KEY) != levels.regenLevel
        || !persistentData.m_128461_(LAST_RESOURCE_KEY).equals(resourceId);

    float maxManaBonus = levels.maxManaLevel * 10.0F;
    if (maxManaBonus > 0) {
      resource.addModifier(MAX_MANA_KEY, maxManaBonus);
    } else {
      resource.removeModifier(MAX_MANA_KEY);
    }

    if (levels.regenLevel > 0) {
      float regenMultiplier = BASE_REGEN_MULTIPLIER + levels.regenLevel * VINTEUM_REGEN_PER_LEVEL;
      resource.addRegenerationModifier(REGEN_KEY, BASE_REGEN_MULTIPLIER / regenMultiplier - 1.0F);
    } else {
      resource.removeRegenerationModifier(REGEN_KEY);
    }

    persistentData.m_128405_(LAST_MAX_LEVEL_KEY, levels.maxManaLevel);
    persistentData.m_128405_(LAST_REGEN_LEVEL_KEY, levels.regenLevel);
    persistentData.m_128359_(LAST_RESOURCE_KEY, resourceId);

    boolean needsSync = restoreSoulsWhileResting(player, resource, levels.regenLevel) || levelChanged;
    if (needsSync) {
      forceMnaResourceSync(player, magic);
    }
  }

  private static boolean restoreSoulsWhileResting(Player player, ICastingResource resource, int regenLevel) {
    if (regenLevel <= 0 || !isSoulsResource(resource) || !isColdDarkResting(player)
        || resource.getAmount() >= resource.getMaxAmount()) {
      return false;
    }

    float regenMultiplier = BASE_REGEN_MULTIPLIER + regenLevel * VINTEUM_REGEN_PER_LEVEL;
    float rate = Math.max(1.0F, GeneralConfigValues.TotalManaRegenTicks * (BASE_REGEN_MULTIPLIER / regenMultiplier));
    resource.restore(resource.getMaxAmount() / rate);
    resource.setNeedsSync();
    return true;
  }

  private static boolean isSoulsResource(ICastingResource resource) {
    ResourceLocation registryName = resource.getRegistryName();
    return registryName != null && registryName.equals(CastingResourceIDs.SOULS);
  }

  private static boolean isColdDarkResting(Player player) {
    return player.m_5803_() || player.m_36331_().m_128441_("coldDarkPos");
  }

  private static void forceMnaResourceSync(ServerPlayer player, IPlayerMagic magic) {
    magic.forceSync(SYNC_CASTING_RESOURCE);
    ServerMessageDispatcher.sendMagicSyncMessage(player);
  }

  private record ManaLevels(int maxManaLevel, int regenLevel) {}
}
