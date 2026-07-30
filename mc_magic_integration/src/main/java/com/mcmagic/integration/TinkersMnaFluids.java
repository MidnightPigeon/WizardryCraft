package com.mcmagic.integration;

import java.util.function.Supplier;
import net.minecraft.world.item.BucketItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.FlowingFluid;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fluids.FluidType;
import net.minecraftforge.fluids.ForgeFlowingFluid;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public final class TinkersMnaFluids {
  private static final DeferredRegister<FluidType> FLUID_TYPES =
      DeferredRegister.create(ForgeRegistries.Keys.FLUID_TYPES, McMagicIntegration.MOD_ID);
  private static final DeferredRegister<net.minecraft.world.level.material.Fluid> FLUIDS =
      DeferredRegister.create(ForgeRegistries.FLUIDS, McMagicIntegration.MOD_ID);

  public static final FluidSet LIQUID_VINTEUM =
      register("liquid_vinteum", 0x87CEEB, 5);
  public static final FluidSet LIQUID_SUPERHEATED_VINTEUM =
      register("liquid_superheated_vinteum", 0xFFC0CB, 10);
  public static final FluidSet LIQUID_PURIFIED_VINTEUM =
      register("liquid_purified_vinteum", 0xA96FCE, 10);
  public static final FluidSet LIQUID_SUPERHEATED_PURIFIED_VINTEUM =
      register("liquid_superheated_purified_vinteum", 0xE9B3F8, 15);
  public static final FluidSet LIQUID_TRANSMUTED_SILVER =
      register("liquid_transmuted_silver", 0xC0C0C0, 5);

  private TinkersMnaFluids() {}

  public static void register(IEventBus modBus) {
    FLUID_TYPES.register(modBus);
    FLUIDS.register(modBus);
  }

  public static void registerContainers(DeferredRegister<Item> items, DeferredRegister<Block> blocks) {
    for (FluidSet fluid : FluidSet.ALL) {
      fluid.registerContainers(items, blocks);
    }
  }

  public static java.util.List<RegistryObject<Item>> bucketItems() {
    java.util.List<RegistryObject<Item>> buckets = new java.util.ArrayList<>();
    for (FluidSet fluid : FluidSet.ALL) {
      if (fluid.bucket != null) {
        buckets.add(fluid.bucket);
      }
    }
    return buckets;
  }

  private static FluidSet register(String name, int color, int light) {
    return new FluidSet(name, color, light);
  }

  public static final class FluidSet {
    private static final java.util.List<FluidSet> ALL = new java.util.ArrayList<>();

    public final String name;
    public final RegistryObject<FluidType> type;
    public final RegistryObject<FlowingFluid> source;
    public final RegistryObject<FlowingFluid> flowing;
    public RegistryObject<TinkersMnaLiquidBlock> block;
    public RegistryObject<Item> bucket;

    private final int light;
    private final ForgeFlowingFluid.Properties properties;

    private FluidSet(String name, int color, int light) {
      this.name = name;
      this.light = light;
      this.type = FLUID_TYPES.register(
          name,
          () -> new TintedFluidType(
              FluidType.Properties.create()
                  .descriptionId("fluid." + McMagicIntegration.MOD_ID + "." + name)
                  .lightLevel(light)
                  .density(2000)
                  .viscosity(3000),
              color));
      this.properties = new ForgeFlowingFluid.Properties(type, sourceSupplier(), flowingSupplier())
          .slopeFindDistance(2)
          .levelDecreasePerBlock(2)
          .tickRate(40)
          .explosionResistance(100.0F);
      this.source = FLUIDS.register(name, () -> new ForgeFlowingFluid.Source(properties));
      this.flowing = FLUIDS.register("flowing_" + name, () -> new ForgeFlowingFluid.Flowing(properties));
      ALL.add(this);
    }

    private Supplier<FlowingFluid> sourceSupplier() {
      return () -> source.get();
    }

    private Supplier<FlowingFluid> flowingSupplier() {
      return () -> flowing.get();
    }

    private void registerContainers(DeferredRegister<Item> items, DeferredRegister<Block> blocks) {
      this.block = blocks.register(
          name,
          () -> new TinkersMnaLiquidBlock(source.get(), BlockBehaviour.Properties.m_284310_()
              .m_60955_()
              .m_60910_()
              .m_60953_(state -> light)));
      this.bucket = items.register(
          name + "_bucket",
          () -> new BucketItem(source.get(), new Item.Properties().m_41487_(1)));
      this.properties.block(block).bucket(bucket);
    }
  }
}
