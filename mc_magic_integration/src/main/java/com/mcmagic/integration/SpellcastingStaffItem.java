package com.mcmagic.integration;

import com.mna.api.spells.ICanContainSpell;
import com.mna.items.sorcery.ItemSpell;
import com.mna.spells.SpellCaster;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.UseAnim;
import net.minecraft.world.level.Level;
import slimeknights.tconstruct.library.tools.definition.ToolDefinition;
import slimeknights.tconstruct.library.tools.item.ModifiableItem;

public class SpellcastingStaffItem extends ModifiableItem implements ICanContainSpell {
  public SpellcastingStaffItem(Properties properties, ToolDefinition toolDefinition) {
    super(properties, toolDefinition);
  }

  @Override
  public InteractionResultHolder<ItemStack> m_7203_(Level level, Player player, InteractionHand hand) {
    ItemStack stack = player.m_21120_(hand);
    if (!this.containsSpell(stack)) {
      return super.m_7203_(level, player, hand);
    }
    return ItemSpell.castSpellOnUse(stack, level, player, hand, itemStack -> true);
  }

  @Override
  public void m_5551_(ItemStack stack, Level level, LivingEntity entity, int ticks) {
    if (entity instanceof Player player) {
      ItemSpell.castSpellOnChannelTick(stack, player, ticks, SpellcastingStaffItem::consumeChanneledMana);
    }
    super.m_5551_(stack, level, entity, ticks);
  }

  @Override
  public ItemStack m_5922_(ItemStack stack, Level level, LivingEntity entity) {
    if (entity instanceof Player player) {
      player.m_21253_();
    }
    return stack;
  }

  @Override
  public int m_8105_(ItemStack stack) {
    return 72000;
  }

  @Override
  public UseAnim m_6164_(ItemStack stack) {
    return UseAnim.BOW;
  }

  private static boolean consumeChanneledMana(Player player, ItemStack stack) {
    return SpellCaster.consumeChanneledMana(player, stack);
  }
}
