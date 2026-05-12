import type * as Blockly from 'blockly';

export const ROBOT_TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '🤖 Movement',
      colour: '120',
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
          type: 'robot_set_motors',
          inputs: {
            LEFT_RPM: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 1200 },
              },
            },
            RIGHT_RPM: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 1200 },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: '📡 Sensors',
      colour: '210',
      contents: [
        { kind: 'block', type: 'robot_get_sensor' },
        { kind: 'block', type: 'robot_wall_detected' },
      ],
    },
    {
      kind: 'category',
      name: '🔁 Loops',
      colour: '290',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
      ],
    },
    {
      kind: 'category',
      name: '❓ Logic',
      colour: '60',
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
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    {
      kind: 'category',
      name: '📦 Variables',
      colour: '330',
      custom: 'VARIABLE',
    },
  ],
};
