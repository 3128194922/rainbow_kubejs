import dev.latvian.mods.rhino.Context;
import dev.latvian.mods.rhino.Scriptable;
import dev.latvian.mods.rhino.ScriptableObject;
import java.nio.file.Files;
import java.nio.file.Path;

// 使用已安装的 Rhino 和 Java NBT 替身验证字符串互操作，不替代 Minecraft 实测。
public class WhistleRhinoCheck {
    public static class ReturnPoint {
        public String getString(String key) {
            return new String(key.equals("owner") ? "owner" : "minecraft:overworld");
        }
        public long getLong(String key) { return 1200L; }
        public double getDouble(String key) { return key.equals("y") ? 65D : 2D; }
        public float getFloat(String key) { return 0F; }
    }

    public static void main(String[] args) throws Exception {
        Context context = Context.enter();
        {
            Scriptable scope = context.initStandardObjects();
            ScriptableObject.putProperty(scope, "returnPoint", Context.javaToJS(context, new ReturnPoint(), scope), context);
            String source = Files.readString(Path.of(args[0]));
            int start = source.indexOf("// --- 鸦羽骨哨 ---");
            int end = source.indexOf("// --- 虚空之眼 ---", start);
            if (start < 0 || end <= start) throw new AssertionError("Missing whistle section");
            context.evaluateString(scope, """
                const errors = [];
                const console = {log: function(message) { errors.push(String(message)); }};
                const callbacks = {};
                const ServerEvents = {tick: function(fn) { callbacks.tick = fn; }};
                const PlayerEvents = {tick: function(fn) { callbacks.playerTick = fn; }};
                function registerSkillSound() {}
                function registerSkill() {}
                const ITeleporter = function() {};
                function JavaAdapter(type, implementation) { return implementation; }
                function Vec3(x, y, z) { this.x = x; this.y = y; this.z = z; }
                Vec3.ZERO = new Vec3(0, 0, 0);
                function PortalInfo(pos, speed, yaw, pitch) { this.pos = pos; }
                """, "whistle-fixture", 1, null);
            context.evaluateString(scope, source.substring(start, end), args[0], 588, null);
            context.evaluateString(scope, """
                const data = {
                    pending: true,
                    contains: function(key) { return this.pending; },
                    getCompound: function(key) { return returnPoint; },
                    remove: function(key) { this.pending = false; },
                    put: function(key, point) { this.pending = true; }
                };
                const origin = {dimension: 'minecraft:overworld', getAllEntities: function() { return []; }};
                const target = {
                    persistentData: data,
                    level: null,
                    x: 8.5, y: -63, z: 8.5,
                    getX: function() { return this.x; },
                    getY: function() { return this.y; },
                    getZ: function() { return this.z; },
                    isPlayer: function() { return false; },
                    changeDimension: function(destination, teleporter) {
                        let info = teleporter.getPortalInfo(this, destination, null);
                        this.level = destination;
                        this.x = info.pos.x; this.y = info.pos.y; this.z = info.pos.z;
                        return this;
                    },
                    setPositionAndRotation: function(x, y, z, yaw, pitch) {
                        this.x = x; this.y = y; this.z = z;
                    },
                    teleportTo: function(dimension, x, y, z, yaw, pitch) {
                        if (String(dimension) !== 'minecraft:overworld' || y !== 65) throw new Error('Wrong return point');
                        this.level = origin;
                    }
                };
                const world = {
                    dimension: 'miniworld:player_owner',
                    getAllEntities: function() { return target.level === this ? [target] : []; }
                };
                target.level = world;
                let now = 1199;
                const server = {
                    getTickCount: function() { return 20; },
                    overworld: function() { return {getTime: function() { return now; }}; },
                    getAllLevels: function() { return [world, origin]; }
                };
                target.server = server;
                // 不提供 scheduleInTicks 任务，验证 /reload 后仅靠持久 NBT 能否返回。
                callbacks.tick({server: server});
                if (target.level !== world || !data.pending) throw new Error('Returned before 200 ticks');
                now = 1200;
                callbacks.tick({server: server});
                if (errors.length > 0) throw new Error(errors.join(', '));
                if (target.level !== origin || data.pending) throw new Error('Expired entity did not return after reload');
                """, "whistle-checks", 1, null);
            System.out.println("whistle Rhino Java NBT return: PASS");
        }
    }
}
