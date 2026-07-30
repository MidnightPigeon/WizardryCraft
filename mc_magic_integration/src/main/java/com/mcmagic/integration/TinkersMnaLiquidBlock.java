package com.mcmagic.integration;

import net.minecraft.world.level.block.LiquidBlock;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.FlowingFluid;

public class TinkersMnaLiquidBlock extends LiquidBlock {
  public TinkersMnaLiquidBlock(FlowingFluid fluid, BlockBehaviour.Properties properties) {
    super(fluid, properties);
  }
}
