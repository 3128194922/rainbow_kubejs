const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function createBuilder(overloadedMethod, expectedType, expectedValueKind) {
    const builder = {};
    const expectedMethodSignature = overloadedMethod + '(' + expectedType + ')';
    [
        'text(java.lang.String)',
        'texture(net.minecraft.resources.ResourceLocation)'
    ].forEach(methodSignature => {
        builder[methodSignature] = value => {
            if (methodSignature === expectedMethodSignature) {
                // 回归测试模拟 Rhino：必须使用完整方法签名绕过重载推断。
                assert.equal(typeof value, expectedValueKind);
            }
            return builder;
        };
    });
    [
        'renderType', 'lifetime', 'scale', 'color', 'alpha', 'gravity', 'friction',
        'textColor', 'textOutlineColor', 'textOutline', 'behavior', 'animation'
    ].forEach(method => {
        builder[method] = () => builder;
    });
    return builder;
}

function runRegistryScript(relativePath, overloadedMethod, expectedType, expectedValueKind) {
    const script = read(relativePath);
    let capturedError = null;
    const JavaString = function (value) {
        this.value = value;
        this.javaType = 'java.lang.String';
    };
    const ResourceLocation = function (namespace, pathValue) {
        this.namespace = namespace;
        this.path = pathValue;
        this.javaType = 'net.minecraft.resources.ResourceLocation';
    };
    const sandbox = {
        console: {
            log(value) {
                if (value != null && typeof value !== 'string') capturedError = value;
            }
        },
        global: {},
        JavaString,
        ResourceLocation,
        StartupEvents: {
            registry(type, callback) {
                assert.equal(type, 'particle_type');
                callback({
                    create(id, builderType) {
                        assert.equal(builderType, 'particlejs');
                        return createBuilder(overloadedMethod, expectedType, expectedValueKind);
                    }
                });
            }
        },
        ForgeEvents: {
            onEvent() {}
        }
    };
    vm.runInNewContext(script, sandbox, { filename: relativePath });
    assert.equal(capturedError, null);
}

test('damage indicator passes an explicit Java String to ParticleJS text overload', () => {
    runRegistryScript(
        'startup_scripts/damage_indicators/main.js',
        'text',
        'java.lang.String',
        'string'
    );
});

test('katana particle passes an explicit ResourceLocation to ParticleJS texture overload', () => {
    runRegistryScript(
        'startup_scripts/damage_indicators/main.js',
        'texture',
        'net.minecraft.resources.ResourceLocation',
        'object'
    );
});
