package com.mcmagic.integration;

import java.util.function.Consumer;
import net.minecraft.resources.ResourceLocation;
import net.minecraftforge.client.extensions.common.IClientFluidTypeExtensions;
import net.minecraftforge.fluids.FluidType;

public class TintedFluidType extends FluidType {
  private static final ResourceLocation STILL =
      new ResourceLocation("tconstruct", "fluid/molten/compat_ore/silver/still");
  private static final ResourceLocation FLOWING =
      new ResourceLocation("tconstruct", "fluid/molten/compat_ore/silver/flowing");

  private final int tint;

  public TintedFluidType(Properties properties, int tint) {
    super(properties);
    this.tint = 0xFF000000 | tint;
  }

  @Override
  public void initializeClient(Consumer<IClientFluidTypeExtensions> consumer) {
    consumer.accept(new IClientFluidTypeExtensions() {
      @Override
      public ResourceLocation getStillTexture() {
        return STILL;
      }

      @Override
      public ResourceLocation getFlowingTexture() {
        return FLOWING;
      }

      @Override
      public int getTintColor() {
        return tint;
      }
    });
  }
}
