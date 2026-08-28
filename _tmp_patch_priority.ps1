$f = 'E:\Server_mod\Kubejs_for_PlayerAnimator\src\main\java\com\kubejs\playeranim\client\ClientAnimHandler.java'
$c = [IO.File]::ReadAllText($f)
$old = 'PlayerAnimationFactory.ANIMATION_DATA_FACTORY.registerFactory(LAYER_ID, 42, player -> {'
$new = 'PlayerAnimationFactory.ANIMATION_DATA_FACTORY.registerFactory(LAYER_ID, 1100, player -> {'
if ($c.Contains($old)) {
    $c = $c.Replace($old, $new)
    [IO.File]::WriteAllText($f, $c)
    Write-Output 'REPLACED OK'
} elseif ($c.Contains($new)) {
    Write-Output 'ALREADY PATCHED'
} else {
    Write-Output 'PATTERN NOT FOUND'
}
