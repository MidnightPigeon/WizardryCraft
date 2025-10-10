//匠魂材料注册辅助配方写在这里
ServerEvents.recipes(event => {

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
    MaterialMelting("kubejs:transmuted_silver","kubejs:liquid_transmuted_silver",90,750)

})