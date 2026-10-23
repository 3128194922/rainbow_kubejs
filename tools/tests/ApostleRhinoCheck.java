import dev.latvian.mods.rhino.Context;
import dev.latvian.mods.rhino.Scriptable;
import java.nio.file.Files;
import java.nio.file.Path;

// 使用整合包实际 Rhino 执行脚本；世界/实体由测试替身提供，不代表进游戏验证。
public class ApostleRhinoCheck {
    public static void main(String[] args) throws Exception {
        Context context = Context.enter();
        Scriptable scope = context.initStandardObjects();
        for (String file : args) {
            context.evaluateString(scope, Files.readString(Path.of(file)), file, 1, null);
        }
        System.out.println("Apostle Rhino checks passed");
    }
}
