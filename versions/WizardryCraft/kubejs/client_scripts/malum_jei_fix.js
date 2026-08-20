const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const ArrayList = Java.loadClass('java.util.ArrayList')
const CodexItemHelper = Java.loadClass('com.sammy.malum.client.screen.codex.helper.CodexItemHelper')
const JEIEventJS = Java.loadClass('pie.ilikepiefoo.compat.jei.events.JEIEventJS')
const JEIHelper = Java.loadClass('com.sammy.malum.compat.jei.JEIHelper')
const MalumItems = Java.loadClass('com.sammy.malum.registry.common.item.MalumItems')
const MalumRecipeTypes = Java.loadClass('com.sammy.malum.registry.common.recipe.MalumRecipeTypes')
const RecipeIngredientRole = Java.loadClass('mezz.jei.api.recipe.RecipeIngredientRole')

const SOUL_BINDING_JEI_CATEGORY = 'kubejs:malum_soul_binding'
const SOUL_BINDING_BACKGROUND = ResourceLocation.parse('kubejs:textures/gui/malum_soulbinding_jei.png')
const SOUL_BINDING_PAGE_X = 4
const SOUL_BINDING_PAGE_Y = 6
const SIDE_SLOT_OFFSET = -1
const CENTER_SLOT_X_OFFSET = -4
const CENTER_SLOT_Y_OFFSET = -1

function sizedIngredientStacks(sizedIngredient) {
  const stacks = new ArrayList()
  const items = sizedIngredient.getItems()

  for (let i = 0; i < items.length; i++) {
    const stack = items[i].copy()
    stack.setCount(sizedIngredient.count())
    stacks.add(stack)
  }

  return stacks
}

function recipeFromCustomRecipe(customRecipe) {
  return customRecipe.data.value()
}

function addSizedIngredientSlot(layout, x, y, sizedIngredient) {
  layout.addInputSlot(x, y)
    .addItemStacks(sizedIngredientStacks(sizedIngredient))
}

function getSoulBindingRecipes() {
  const level = Client.level
  if (level == null) {
    console.warn('Skipped Malum soul binding JEI data because no client level is available.')
    return null
  }

  return level.getRecipeManager().getAllRecipesFor(MalumRecipeTypes.SOUL_BINDING.get())
}

JEIAddedEvents.registerCategories(event => {
  const guiHelper = event.JEI_HELPERS.guiHelper

  event.custom(SOUL_BINDING_JEI_CATEGORY, category => {
    category
      .title(Text.translatable('malum.gui.book.entry.page.info.soul_binding.headline'))
      .background(guiHelper.createDrawable(SOUL_BINDING_BACKGROUND, 0, 0, 142, 185))
      .icon(guiHelper.createDrawableItemStack(Item.of('malum:soulbinding_brazier')))
      .isRecipeHandled(customRecipe => customRecipe.data != null)
      .registryName(customRecipe => customRecipe.data.id())
      .handleLookup((layout, customRecipe, focuses) => {
        const recipe = recipeFromCustomRecipe(customRecipe)

        JEIHelper.addCustomIngredientToJei(layout, RecipeIngredientRole.INPUT, SOUL_BINDING_PAGE_X + 13 + SIDE_SLOT_OFFSET, SOUL_BINDING_PAGE_Y + 87 + SIDE_SLOT_OFFSET, true, recipe.spirits)
        JEIHelper.addSizedIngredientsToJei(layout, RecipeIngredientRole.INPUT, SOUL_BINDING_PAGE_X + 113 + SIDE_SLOT_OFFSET, SOUL_BINDING_PAGE_Y + 87 + SIDE_SLOT_OFFSET, true, recipe.extraInputs)
        addSizedIngredientSlot(layout, SOUL_BINDING_PAGE_X + 63 + CENTER_SLOT_X_OFFSET, SOUL_BINDING_PAGE_Y + 87 + CENTER_SLOT_Y_OFFSET, recipe.input)

        layout.addOutputSlot(SOUL_BINDING_PAGE_X + 63 + CENTER_SLOT_X_OFFSET, SOUL_BINDING_PAGE_Y + 38 + CENTER_SLOT_Y_OFFSET)
          .addItemStack(recipe.result.createDefaultStack())
      })
      .setDrawHandler((customRecipe, recipeSlotsView, guiGraphics, mouseX, mouseY) => {
        const recipe = recipeFromCustomRecipe(customRecipe)

        CodexItemHelper.renderItemFrames(guiGraphics, recipe.spirits.size(), SOUL_BINDING_PAGE_X + 13, SOUL_BINDING_PAGE_Y + 87, true)
        if (!recipe.extraInputs.isEmpty()) {
          CodexItemHelper.renderItemFrames(guiGraphics, recipe.extraInputs.size(), SOUL_BINDING_PAGE_X + 113, SOUL_BINDING_PAGE_Y + 87, true)
        }
      })
  })
})

JEIAddedEvents.registerRecipeCatalysts(event => {
  const recipeType = JEIEventJS.getCustomRecipeType(ResourceLocation.parse(SOUL_BINDING_JEI_CATEGORY))
  if (recipeType != null) {
    event.data['addRecipeCatalyst(net.minecraft.world.level.ItemLike,mezz.jei.api.recipe.RecipeType[])'](MalumItems.SOUL_BRAZIER.get(), [recipeType])
    console.info('Added Malum soulbinding brazier as a JEI catalyst for soul binding recipes.')
  }
})

JEIAddedEvents.registerRecipes(event => {
  const soulBindingRecipes = getSoulBindingRecipes()
  if (soulBindingRecipes == null) {
    return
  }

  event.custom(ResourceLocation.parse(SOUL_BINDING_JEI_CATEGORY)).addAll(soulBindingRecipes)
  console.info(`Added ${soulBindingRecipes.size()} Malum soul binding recipes to JEI.`)
})
