import type * as Blockly from 'blockly';

export const ROBOT_TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '🤖 Movement',
      categorystyle: 'movement_category',
      contents: [
        {
          kind: 'block',
          type: 'robot_move',
          inputs: {
            DISTANCE: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 180 },
              },
            },
          },
        },
        { kind: 'block', type: 'robot_turn' },
        { kind: 'block', type: 'robot_stop' },
        {
          kind: 'block',
          type: 'robot_set_wheel_speed',
          inputs: {
            RPM: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 500 },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: '📡 Sensors',
      categorystyle: 'sensor_category',
      contents: [
        { kind: 'block', type: 'robot_get_sensor' },
        { kind: 'block', type: 'robot_wall_detected' },
        { kind: 'block', type: 'robot_at_goal' },
      ],
    },
    {
      kind: 'category',
      name: '🛠️ Utilities',
      categorystyle: 'logic_category',
      contents: [
        { kind: 'block', type: 'robot_reset_position' },
        { kind: 'block', type: 'robot_reset_timer' },
        { kind: 'block', type: 'robot_log' },
        {
          kind: 'block',
          type: 'robot_wait',
          inputs: {
            MS: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 1000 },
              },
            },
          },
        },
        { kind: 'block', type: 'robot_bypass_goal_detect' },
      ],
    },
    {
      kind: 'category',
      name: '🔁 Loops',
      categorystyle: 'loop_category',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
      ],
    },
    {
      kind: 'category',
      name: '❓ Logic',
      categorystyle: 'logic_category',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: '🔢 Math',
      categorystyle: 'math_category',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    {
      kind: 'category',
      name: '🔤 Text',
      categorystyle: 'text_category',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_append' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_isEmpty' },
        { kind: 'block', type: 'text_reverse' },
        { kind: 'block', type: 'text_trim' },
        { kind: 'block', type: 'text_changeCase' },
        { kind: 'block', type: 'text_count' },
        { kind: 'block', type: 'text_replace' },
        { kind: 'block', type: 'text_indexOf' },
        { kind: 'block', type: 'text_charAt' },
        { kind: 'block', type: 'text_getSubstring' },
      ],
    },
    {
      kind: 'category',
      name: '⚙️ Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
    },
    {
      kind: 'category',
      name: '📦 Variables',
      colour: '#9ca3af',
      custom: 'VARIABLE',
    },
  ],
};
