const BookLoader = Java.loadClass('slimeknights.mantle.client.book.BookLoader')
const TierRangeMaterialSectionTransformer = Java.loadClass('slimeknights.tconstruct.library.client.book.sectiontransformer.materials.TierRangeMaterialSectionTransformer')
const BiFunction = Java.loadClass('java.util.function.BiFunction')
const MaterialVariantId = Java.loadClass('slimeknights.tconstruct.library.materials.definition.MaterialVariantId')

const MagicMaterialContent = Java.loadClass('com.snackpirate.constructscasting.items.book.MagicMaterialContent')
const MagicBaseMaterialStats = Java.loadClass('com.snackpirate.constructscasting.materials.MagicBaseMaterialStats')
const MagicClothMaterialStats = Java.loadClass('com.snackpirate.constructscasting.materials.MagicClothMaterialStats')
const AdornmentStats = Java.loadClass('com.snackpirate.constructscasting.materials.CCMaterialStats$Statless').ADORNMENT

try {
  BookLoader.registerPageType(MagicMaterialContent.ID, MagicMaterialContent.class)
  console.info(`[Constructs Casting Book] Registered page type: ${MagicMaterialContent.ID}`)
} catch (error) {
  console.info(`[Constructs Casting Book] Page type already registered: ${MagicMaterialContent.ID}`)
}

try {
  TierRangeMaterialSectionTransformer.registerMaterialType(
    MagicMaterialContent.ID,
    new JavaAdapter(BiFunction, {
      apply: (material, detailed) => {
        const variant = MaterialVariantId.create(material.getId(), 'default')
        return new MagicMaterialContent(variant, !!detailed)
      }
    }),
    MagicBaseMaterialStats.ID,
    MagicClothMaterialStats.ID,
    AdornmentStats.getIdentifier()
  )
  console.info(`[Constructs Casting Book] Registered material category: ${MagicMaterialContent.ID}`)
} catch (error) {
  console.warn(`[Constructs Casting Book] Material category already registered or unavailable: ${MagicMaterialContent.ID}`)
}
