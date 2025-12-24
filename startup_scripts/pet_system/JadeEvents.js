JadeEvents.onCommonRegistration(event=>{
    event.entityDataProvider('rainbow:MindControl', $Entitys).setCallback((tag,accessor)=>{
        let entity = accessor.getEntity();
        if (!entity) return;
        if (!entity.persistentData.OwnerName) return;
        tag.putString("OwnerName_",entity.persistentData.OwnerName);
    })
})