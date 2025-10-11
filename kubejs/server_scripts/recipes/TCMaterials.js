//匠魂材料注册辅助配方写在这里
ServerEvents.recipes(event => {

    //液体材料定义
    function MaterialMelting(material, fluid, fluid_amount, temperature) {
        event.custom({
            "type": "tconstruct:material_fluid",
            "fluid": {
                "amount": fluid_amount,
                "fluid": fluid
            },
            "output": material,
            "temperature": temperature
        })
    }
    //超越1的材料定义
    function OverandReduce(OverItem, Item, Material, OverValue) {
        event.custom({
            "type": "tconstruct:material",
            "ingredient": {
                "item": OverItem
            },
            "material": Material,
            "needed": 1,
            "value": OverValue
        })
        event.custom({
            "type": "tconstruct:material",
            "ingredient": {
                "item": OverItem
            },
            "leftover": {
                "count": 1,
                "item": Item
            },
            "material": Material,
            "needed": 1,
            "value": OverValue
        })
    }


    //嬗变银
    event.custom({
        "type": "tconstruct:material",
        "ingredient": {
            "item": "mna:transmuted_silver"
        },
        "material": "kubejs:transmuted_silver",
        "needed": 1,
        "value": 1
    })
    MaterialMelting("kubejs:transmuted_silver","kubejs:liquid_transmuted_silver",90,500)
    OverandReduce("mna:decoration/transmuted_silver_block","mna:transmuted_silver","kubejs:transmuted_silver",9)

})