TConJSEvents.modifierRegistry((event) => {
    event.createEmpty("id");

    //测试区
    event.createNew("give_me_hat", (builder) => {
            builder
                .projectileHitEntity((modifier, modDataNBT, damage, projectile, hitResult, sourceEntity, targetEntity) => {
                    targetEntity.block.up.popItem(targetEntity.headArmorItem);
                    targetEntity.headArmorItem = "air";
                    return false;
                })
                .onAfterMeleeHit((view, damage, context) => {
                    context.livingTarget.block.up.popItem(context.livingTarget.headArmorItem);
                    context.livingTarget.headArmorItem = "air";
                });
    });

    //新增材料列表：
    //墓园：暗铁
    //MNA：温特姆、纯净温特姆、超热温特姆、超热纯净温特姆、嬗变银
    //更好的下界：辛辛那金，下界红宝石
    //更好的末地：末影铁，太古合金，终末合金



})