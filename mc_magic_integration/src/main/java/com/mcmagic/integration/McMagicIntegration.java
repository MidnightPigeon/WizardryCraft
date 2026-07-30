package com.mcmagic.integration;

import com.mna.api.ManaAndArtificeMod;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraftforge.event.BuildCreativeModeTabContentsEvent;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import slimeknights.tconstruct.library.tools.definition.ToolDefinition;

@Mod(McMagicIntegration.MOD_ID)
public class McMagicIntegration {
  public static final String MOD_ID = "tinkers_mna";

  private static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, MOD_ID);
  static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, MOD_ID);
  private static final List<RegistryObject<Item>> CAST_ITEMS = new ArrayList<>();
  private static final ResourceKey<CreativeModeTab> INGREDIENTS_TAB =
      ResourceKey.m_135785_(Registries.f_279569_, new ResourceLocation("minecraft", "ingredients"));

  public static final RegistryObject<Item> STAFF = ITEMS.register(
      "staff",
      () -> new SpellcastingStaffItem(
          new Item.Properties().m_41487_(1),
          ToolDefinition.create(new ResourceLocation(MOD_ID, "staff"))));

  private static final String[] RUNE_CASTS = {
      "ritual_rune_cast", "defense_rune_cast", "aura_rune_cast", "projection_rune_cast",
      "marking_rune_cast", "earth_rune_cast", "water_rune_cast", "fire_rune_cast",
      "air_rune_cast", "ender_rune_cast", "arcane_rune_cast"
  };

  private static final String[] FRAME_CASTS = {
      "rod_frame_cast", "torso_frame_cast", "head_frame_cast", "hips_frame_cast",
      "claw_frame_cast", "hammer_frame_cast", "axe_frame_cast"
  };

  public McMagicIntegration() {
    IEventBus modBus = FMLJavaModLoadingContext.get().getModEventBus();
    registerCastItems();
    TinkersMnaFluids.registerContainers(ITEMS, BLOCKS);
    ITEMS.register(modBus);
    BLOCKS.register(modBus);
    TinkersMnaFluids.register(modBus);
    TinkersMnaModifiers.register(modBus);
    modBus.addListener(this::addCreativeTabItems);
    modBus.addListener(this::commonSetup);
  }

  private static void registerCastItems() {
    for (String cast : RUNE_CASTS) {
      CAST_ITEMS.add(ITEMS.register(cast, () -> new Item(new Item.Properties().m_41487_(1))));
    }
    for (String cast : FRAME_CASTS) {
      CAST_ITEMS.add(ITEMS.register(cast, () -> new Item(new Item.Properties().m_41487_(1))));
    }
  }

  private void addCreativeTabItems(BuildCreativeModeTabContentsEvent event) {
    if (!INGREDIENTS_TAB.equals(event.getTabKey())) {
      return;
    }
    event.accept(STAFF);
    for (RegistryObject<Item> cast : CAST_ITEMS) {
      event.accept(cast);
    }
    for (RegistryObject<Item> bucket : TinkersMnaFluids.bucketItems()) {
      event.accept(bucket);
    }
  }

  private void commonSetup(FMLCommonSetupEvent event) {
    event.enqueueWork(() -> {
      if (ManaAndArtificeMod.getSpellHelper() != null) {
        ManaAndArtificeMod.getSpellHelper().registerSpellCastingItem(STAFF.get());
      }
    });
  }
}
