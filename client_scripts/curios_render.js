// priority: 500
// ==========================================
// 🎨 饰品自定义渲染脚本
// ==========================================

CuriosJSEvents.registerRenderer(event => {
    // remove curios render
    //event.remove('test')

    // register curios render
    event.register(
        'rainbow:sunglasses',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context
            let { modelManager } = Client
            let entity = slotContext.entity()
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'))
            matrixStack.pushPose()
            CuriosRenderer.translateIfSneaking(matrixStack, entity)
            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))
            matrixStack.mulPose(RotationAxis.YP.deg(-netHeadYaw))
            matrixStack.mulPose(RotationAxis.XP.deg(-headPitch))
            matrixStack.translate(0, -0.4, -0.65)
            matrixStack.scale(0.9,0.9,0.9)
            Client.itemRenderer.render(
                stack,
                'head',
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            )
            matrixStack.popPose()
        }
    )

    event.register(
        'farmersdelight:skillet',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context
            let { modelManager } = Client
            let entity = slotContext.entity()
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'))
            matrixStack.pushPose()
            CuriosRenderer.translateIfSneaking(matrixStack, entity)
            matrixStack.mulPose(RotationAxis.YP.deg(netHeadYaw))
            matrixStack.mulPose(RotationAxis.XP.deg(headPitch));
            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))
            matrixStack.mulPose(new Quaternionf().rotateY(JavaMath.toRadians(90)))
            matrixStack.scale(0.8,0.8,0.8)
            matrixStack.translate(0, 0.2, 0)
            Client.itemRenderer.render(
                stack,
                'head',
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            )
            matrixStack.popPose()
        }
    )

    event.register(
        'dungeonsdelight:golden_cleaver',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context
            let { modelManager } = Client
            let entity = slotContext.entity()
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'))
            matrixStack.pushPose()
            CuriosRenderer.translateIfSneaking(matrixStack, entity)
            matrixStack.mulPose(RotationAxis.YP.deg(netHeadYaw))
            matrixStack.mulPose(RotationAxis.XP.deg(headPitch));
            matrixStack.scale(0.8,0.8,0.8)
            matrixStack.translate(-0.3,-1.8, -0.4)
            Client.itemRenderer.render(
                stack,
                'head',
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            )
            matrixStack.popPose()
        }
    )

    event.register(
        'rainbow:eldritch_pan',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context
            let { modelManager } = Client
            let entity = slotContext.entity()
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'))
            matrixStack.pushPose()
            CuriosRenderer.translateIfSneaking(matrixStack, entity)
            matrixStack.mulPose(RotationAxis.YP.deg(netHeadYaw))
            matrixStack.mulPose(RotationAxis.XP.deg(headPitch))
            matrixStack.translate(0, -1.0, 0)
            Client.itemRenderer.render(
                stack,
                'head',
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            )
            matrixStack.popPose()
        }
    )

    event.register(
        'farmersdelight:basket',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context
            let { modelManager } = Client
            let entity = slotContext.entity()
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'))
            matrixStack.pushPose()
            CuriosRenderer.translateIfSneaking(matrixStack, entity)
            matrixStack.mulPose(RotationAxis.YP.deg(netHeadYaw))
            matrixStack.mulPose(RotationAxis.XP.deg(headPitch))
            matrixStack.translate(0, -0.2, 0)
            Client.itemRenderer.render(
                stack,
                'head',
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            )
            matrixStack.popPose()
        }
    )

    event.register(
        'minecraft:tnt',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'alexscaves:nuclear_bomb',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'rottencreatures:tnt_barrel',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )
    
    event.register(
        'oreganized:shrapnel_bomb',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'savage_and_ravage:spore_bomb',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'minecraft:end_rod',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.9, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))
            matrixStack.mulPose(new Quaternionf().rotateX(JavaMath.toRadians(-45)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'create:netherite_backtank',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(2, 2, 2);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'create:copper_backtank',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.3, 0.3); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))

            // 缩放饰品
            matrixStack.scale(2, 2, 2);
    
            Client.itemRenderer.render(
                stack,
                'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    event.register(
        'royalvariations:royal_staff',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light,
                limbSwing,
                limbSwingAmount,
                partialTicks,
                ageInTicks,
                netHeadYaw,
                headPitch
            } = context;
    
            let { modelManager } = Client;
            let entity = slotContext.entity();
            let model = modelManager.getModel(new ModelResourceLocation(stack.id, "inventory"));
    
            matrixStack.pushPose();
    
            // 玩家蹲下时微调位置
            CuriosRenderer.translateIfSneaking(matrixStack, entity);
    
            // 背部定位：偏移到背后，朝外
            matrixStack.translate(0.0, 0.8, 0.0); // X, Y, Z位置调整（Y适应高度，Z适应后背）

            matrixStack.mulPose(new Quaternionf().rotateX(JavaMath.toRadians(270)))

            // 缩放饰品
            matrixStack.scale(1, 1, 1);
    
            Client.itemRenderer.render(
                stack,
                'none', // 使用 'none' 避免触发 forge:separate_transforms 的 fixed/gui 替换逻辑，从而使用 base (手持) 模型
                false,
                matrixStack,
                renderTypeBuffer,
                light,
                OverlayTexture.NO_OVERLAY,
                model
            );
    
            matrixStack.popPose();
        }
    )

    const banners = ['minecraft:white_banner', 'minecraft:light_gray_banner', 'minecraft:gray_banner', 'minecraft:black_banner', 'minecraft:brown_banner', 'minecraft:red_banner', 'minecraft:orange_banner', 'minecraft:yellow_banner', 'minecraft:lime_banner', 'minecraft:green_banner', 'minecraft:cyan_banner', 'minecraft:light_blue_banner', 'minecraft:blue_banner', 'minecraft:purple_banner', 'minecraft:magenta_banner', 'minecraft:pink_banner']
    banners.forEach(item=>{
        event.register(
            item,
            context => {
                let {
                    stack,
                    slotContext,
                    matrixStack,
                    renderLayerParent,
                    renderTypeBuffer,
                    light,
                    limbSwing,
                    limbSwingAmount,
                    partialTicks,
                    ageInTicks,
                    netHeadYaw,
                    headPitch
                } = context;
        
                let { modelManager } = Client;
                let entity = slotContext.entity();
                let model = modelManager.getModel(new ModelResourceLocation(stack.id, 'inventory'));
        
                matrixStack.pushPose();
        
                // 玩家蹲下时微调位置
                CuriosRenderer.translateIfSneaking(matrixStack, entity);
        
                // 背部定位：偏移到背后，朝外
                matrixStack.translate(0.0, -0.3, 0.2); // X, Y, Z位置调整（Y适应高度，Z适应后背）
    
                matrixStack.mulPose(new Quaternionf().rotateZ(JavaMath.toRadians(180)))
    
                // 缩放饰品
                matrixStack.scale(1.5, 1.5, 1.5);
        
                Client.itemRenderer.render(
                    stack,
                    'fixed', // 合法的渲染类型，用 'fixed' 或 'none' 即可
                    false,
                    matrixStack,
                    renderTypeBuffer,
                    light,
                    OverlayTexture.NO_OVERLAY,
                    model
                );
        
                matrixStack.popPose();
            }
        )
    })

    // ==========================================
    // 🏹 箭袋(rainbow:quiver) - 采用人体模型渲染，渲染全部部位
    // 素材：assets/rainbow/textures/models/armor/sk1.png
    // 说明：renderLayerParent.getModel() 返回实体主模型(动画已由主渲染设置)，
    //       蹲下姿态由模型自身处理，无需 translateIfSneaking（避免双重下移）
    // ==========================================
    event.register(
        'rainbow:quiver',
        context => {
            let {
                stack,
                slotContext,
                matrixStack,
                renderLayerParent,
                renderTypeBuffer,
                light
            } = context

            try {
                // 实体当前人体模型（HumanoidModel，动画已由主渲染设置），渲染全部部位
                let model = renderLayerParent.getModel()

                matrixStack.pushPose()
                try {
                    // 使用全身纹理渲染
                    let texture = new ResourceLocation('rainbow', 'textures/models/armor/sk1.png')
                    let vertexConsumer = renderTypeBuffer.getBuffer($RenderType.entityCutoutNoCull(texture))
                    model.renderToBuffer(matrixStack, vertexConsumer, light, OverlayTexture.NO_OVERLAY, 1.0, 1.0, 1.0, 1.0)
                } finally {
                    matrixStack.popPose()
                }
            } catch (e) {
                console.error('[rainbow:quiver] curios渲染失败: ' + e)
            }
        }
    )
})