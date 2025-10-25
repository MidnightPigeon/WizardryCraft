//铁魔法相关修改写在这里
ServerEvents.recipes(event => {
    
    event.replaceInput({mod:'irons_spellbooks',output:'irons_spellbooks:inscription_table'},
        'minecraft:book' , 'mna:arcanist_ink')

})