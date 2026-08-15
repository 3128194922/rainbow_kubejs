#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blockbench Bedrock 动画 → playerAnimator emote 格式转换器

用法 (打包为 exe 后):
1. 将 bb_to_emote.exe 放到包含 .json 动画文件的目录中
   (例如 kubejs/assets/rainbow/player_animation/)
2. 双击运行
3. 自动扫描 exe 所在目录下所有 .json 文件 (不递归子目录)
4. 识别 Bedrock 格式 (严格判断: 顶层含 format_version + animations 字段)
5. 转换为 playerAnimator emote 格式
6. 输出到 converted/ 子目录, 原文件保留

转换规则:
- 时间: 秒 → tick (×20, 四舍五入到整数)
- 骨骼: 下划线命名 → 驼峰命名 (right_arm → rightArm, body → torso)
- 旋转: Bedrock vector[x,y,z] → playerAnimator pitch/yaw/roll
- 位移: pixel ÷ 16 = block (像素单位转为方块单位)
- 度数: degrees=true (Blockbench 导出是度数)
- 缓动: 默认 EASEINOUTQUAD

Bedrock 格式 (Blockbench 导出):
{
    "format_version": "1.8.0",
    "animations": {
        "anim_name": {
            "animation_length": 0.5,
            "bones": {
                "right_arm": {
                    "rotation": { "0.0": {"vector": [0,0,0]}, "0.5": {"vector": [-90,0,0]} },
                    "position": { "0.0": {"vector": [0,0,0]}, "0.5": {"vector": [1,0,0]} }
                }
            }
        }
    }
}

playerAnimator emote 格式 (输出):
{
    "name": "anim_name",
    "emote": {
        "beginTick": 0,
        "endTick": 10,
        "stopTick": 10,
        "degrees": true,
        "moves": [
            { "tick": 0, "easing": "EASEINOUTQUAD", "rightArm": {"pitch":0,"yaw":0,"roll":0,"x":0,"y":0,"z":0} },
            { "tick": 10, "easing": "EASEINOUTQUAD", "rightArm": {"pitch":-90,"yaw":0,"roll":0,"x":0.0625,"y":0,"z":0} }
        ]
    }
}
"""

import os
import sys
import json
import glob

# Windows 下设置控制台编码为 UTF-8, 避免中文乱码
if sys.platform == 'win32':
    os.system('chcp 65001 > nul 2>&1')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except (AttributeError, Exception):
        pass

# 骨骼名称映射 (Bedrock → playerAnimator)
BONE_MAP = {
    'head': 'head',
    'body': 'torso',
    'torso': 'torso',
    'right_arm': 'rightArm',
    'left_arm': 'leftArm',
    'right_leg': 'rightLeg',
    'left_leg': 'leftLeg',
}

# 默认缓动函数
DEFAULT_EASE = 'EASEINOUTQUAD'


def is_bedrock_format(data):
    """
    严格判断是否为 Bedrock 格式: 顶层含 format_version + animations 字段
    (playerAnimator emote 格式顶层是 name + emote, 不会误判)
    """
    if not isinstance(data, dict):
        return False
    if 'format_version' not in data:
        return False
    if 'animations' not in data:
        return False
    if not isinstance(data['animations'], dict):
        return False
    return True


def time_to_tick(time_str):
    """将时间戳字符串(秒)转为 tick 整数 (×20, 四舍五入)"""
    try:
        seconds = float(time_str)
        tick = round(seconds * 20)
        return tick if tick >= 0 else None
    except (ValueError, TypeError):
        return None


def map_bone_name(bedrock_name):
    """Bedrock 骨骼名 → playerAnimator 骨骼名"""
    return BONE_MAP.get(bedrock_name, bedrock_name)


def extract_vector(keyframe):
    """
    从 Bedrock 关键帧提取向量
    支持两种形式:
      - {"vector": [x, y, z]}
      - [x, y, z]
    """
    if isinstance(keyframe, dict) and 'vector' in keyframe:
        return keyframe['vector']
    if isinstance(keyframe, list):
        return keyframe
    return None


def convert_vector_to_fields(vector, is_rotation=True):
    """
    将 Bedrock vector [x,y,z] 转换为字段
    - rotation: [pitch, yaw, roll]
    - position: [x, y, z] (pixel ÷ 16 = block)
    """
    if not isinstance(vector, list) or len(vector) < 3:
        return {}

    try:
        x, y, z = float(vector[0]), float(vector[1]), float(vector[2])
    except (ValueError, TypeError):
        return {}

    if is_rotation:
        return {'pitch': x, 'yaw': y, 'roll': z}
    else:
        # 位移: pixel ÷ 16 = block
        return {'x': x / 16.0, 'y': y / 16.0, 'z': z / 16.0}


def convert_animation(anim_name, anim_data):
    """
    转换单个 Bedrock 动画为 playerAnimator emote 格式
    返回 emote dict 或 None (转换失败时)
    """
    if not isinstance(anim_data, dict):
        return None

    bones = anim_data.get('bones', {})
    if not bones or not isinstance(bones, dict):
        return None

    # 收集所有关键帧
    # bone_timeline[bone_name][tick] = {pitch, yaw, roll, x, y, z, ...}
    bone_timeline = {}
    all_ticks = set()

    for bone_name, bone_data in bones.items():
        if not isinstance(bone_data, dict):
            continue

        mapped_name = map_bone_name(bone_name)
        if mapped_name not in bone_timeline:
            bone_timeline[mapped_name] = {}

        # 处理 rotation 轨道
        rotation_data = bone_data.get('rotation', {})
        if isinstance(rotation_data, dict):
            for time_str, keyframe in rotation_data.items():
                tick = time_to_tick(time_str)
                if tick is None:
                    continue
                if tick not in bone_timeline[mapped_name]:
                    bone_timeline[mapped_name][tick] = {}
                vector = extract_vector(keyframe)
                fields = convert_vector_to_fields(vector, is_rotation=True)
                bone_timeline[mapped_name][tick].update(fields)
                all_ticks.add(tick)

        # 处理 position 轨道
        position_data = bone_data.get('position', {})
        if isinstance(position_data, dict):
            for time_str, keyframe in position_data.items():
                tick = time_to_tick(time_str)
                if tick is None:
                    continue
                if tick not in bone_timeline[mapped_name]:
                    bone_timeline[mapped_name][tick] = {}
                vector = extract_vector(keyframe)
                fields = convert_vector_to_fields(vector, is_rotation=False)
                bone_timeline[mapped_name][tick].update(fields)
                all_ticks.add(tick)

    if not all_ticks:
        return None

    # 排序 tick
    sorted_ticks = sorted(all_ticks)

    # 构建 moves
    moves = []
    for tick in sorted_ticks:
        move = {'tick': tick, 'easing': DEFAULT_EASE}
        for bone_name, timeline in bone_timeline.items():
            if tick in timeline:
                move[bone_name] = timeline[tick]
        moves.append(move)

    # 计算 beginTick/endTick/stopTick
    begin_tick = sorted_ticks[0]
    end_tick = sorted_ticks[-1]
    stop_tick = end_tick

    emote = {
        'name': anim_name,
        'author': 'Blockbench Export (Converted to playerAnimator emote)',
        'description': 'Converted from Bedrock format: ' + anim_name,
        'emote': {
            'beginTick': begin_tick,
            'endTick': end_tick,
            'stopTick': stop_tick,
            'degrees': True,
            'moves': moves
        }
    }

    return emote


def convert_file(input_path, output_dir):
    """转换单个文件, 返回转换的动画数量"""
    filename = os.path.basename(input_path)
    name_without_ext = os.path.splitext(filename)[0]

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print('  [跳过] ' + filename + ': JSON 解析失败 (' + str(e) + ')')
        return 0
    except Exception as e:
        print('  [跳过] ' + filename + ': 读取失败 (' + str(e) + ')')
        return 0

    if not is_bedrock_format(data):
        return 0  # 不是 Bedrock 格式, 静默跳过

    print('  [转换] ' + filename)

    animations = data['animations']
    converted_count = 0

    for anim_name, anim_data in animations.items():
        emote = convert_animation(anim_name, anim_data)
        if emote is None:
            print('    - 跳过动画 "' + anim_name + '": 无有效关键帧')
            continue

        # 输出文件名: 单动画用原文件名, 多动画用 文件名_动画名.json
        if len(animations) == 1:
            output_filename = name_without_ext + '.json'
        else:
            safe_anim_name = anim_name.replace(':', '_').replace('/', '_')
            output_filename = name_without_ext + '_' + safe_anim_name + '.json'

        output_path = os.path.join(output_dir, output_filename)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(emote, f, indent=4, ensure_ascii=False)

        print('    - 输出动画 "' + anim_name + '" -> ' + output_filename)
        converted_count += 1

    return converted_count


def main():
    # 获取 exe 所在目录 (PyInstaller 打包后用 sys.executable, 否则用 __file__)
    if getattr(sys, 'frozen', False):
        script_dir = os.path.dirname(sys.executable)
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))

    print('=' * 60)
    print('Blockbench Bedrock -> playerAnimator emote 转换器')
    print('=' * 60)
    print('扫描目录: ' + script_dir)
    print()

    # 创建输出目录
    output_dir = os.path.join(script_dir, 'converted')
    os.makedirs(output_dir, exist_ok=True)
    print('输出目录: ' + output_dir)
    print()

    # 扫描当前目录下所有 .json 文件 (不递归子目录)
    json_files = glob.glob(os.path.join(script_dir, '*.json'))

    if not json_files:
        print('未找到任何 .json 文件')
        input('按回车键退出...')
        return

    print('找到 ' + str(len(json_files)) + ' 个 .json 文件')
    print()

    total_converted = 0
    total_files = 0

    for json_file in json_files:
        count = convert_file(json_file, output_dir)
        if count > 0:
            total_files += 1
            total_converted += count

    print()
    print('=' * 60)
    print('转换完成: ' + str(total_files) + ' 个文件, ' + str(total_converted) + ' 个动画')
    print('输出位置: ' + output_dir)
    print('=' * 60)

    input('按回车键退出...')


if __name__ == '__main__':
    main()
