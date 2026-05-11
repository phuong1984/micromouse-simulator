import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';

let registered = false;

export function registerRobotBlocks(): void {
  if (registered) return;
  registered = true;

  // --- Block Definitions ---

  Blockly.Blocks['robot_move'] = {
    init: function() {
      this.appendValueInput('DISTANCE')
          .setCheck('Number')
          .appendField('Move');
      this.appendDummyInput()
          .appendField('mm');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(230); // Blue to distinguish from Green Loops
      this.setTooltip('Move forward a specific distance (mm)');
    }
  };

  Blockly.Blocks['robot_turn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Turn')
          .appendField(new Blockly.FieldDropdown([
            ['Left', 'LEFT'],
            ['Right', 'RIGHT'],
          ]), 'DIRECTION')
          .appendField(new Blockly.FieldNumber(90, 1, 360), 'ANGLE')
          .appendField('degrees');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(230);
      this.setTooltip('Turn robot in place');
    }
  };

  Blockly.Blocks['robot_stop'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Stop');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(230);
      this.setTooltip('Stop robot');
    }
  };

  Blockly.Blocks['robot_set_motors'] = {
    init: function() {
      this.appendValueInput('LEFT_RPM')
          .setCheck('Number')
          .appendField('Set Motors: Left');
      this.appendValueInput('RIGHT_RPM')
          .setCheck('Number')
          .appendField('RPM, Right');
      this.appendDummyInput()
          .appendField('RPM');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(30);
      this.setTooltip('Directly set motor speeds');
    }
  };

  Blockly.Blocks['robot_get_sensor'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Get Sensor')
          .appendField(new Blockly.FieldDropdown([
            ['Front', 'front'],
            ['Left', 'left'],
            ['Right', 'right'],
            ['Front-Left', 'front-left'],
            ['Front-Right', 'front-right'],
          ]), 'SENSOR_ID');
      this.setOutput(true, 'Number');
      this.setColour(210);
      this.setTooltip('Get distance from sensor (mm), -1 if none');
    }
  };

  Blockly.Blocks['robot_wall_detected'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Wall Detected at')
          .appendField(new Blockly.FieldDropdown([
            ['Front', 'front'],
            ['Left', 'left'],
            ['Right', 'right'],
          ]), 'DIRECTION')
          .appendField('within')
          .appendField(new Blockly.FieldNumber(100, 10, 500), 'THRESHOLD')
          .appendField('mm');
      this.setOutput(true, 'Boolean');
      this.setColour(210);
      this.setTooltip('Check if wall is detected');
    }
  };

  // --- Python Generators ---

  pythonGenerator.forBlock['robot_move'] = function (block: Blockly.Block) {
    const distance = pythonGenerator.valueToCode(block, 'DISTANCE', Order.ATOMIC) || '180';
    return `robot.move(${distance})\n`;
  };

  pythonGenerator.forBlock['robot_turn'] = function (block: Blockly.Block) {
    const dir = block.getFieldValue('DIRECTION') as string;
    const angle = block.getFieldValue('ANGLE') as number;
    const signedAngle = dir === 'LEFT' ? -angle : angle;
    return `robot.turn(${signedAngle})\n`;
  };

  pythonGenerator.forBlock['robot_stop'] = function (_block: Blockly.Block) {
    return `robot.stop()\n`;
  };

  pythonGenerator.forBlock['robot_set_motors'] = function (block: Blockly.Block) {
    const left = pythonGenerator.valueToCode(block, 'LEFT_RPM', Order.ATOMIC) || '0';
    const right = pythonGenerator.valueToCode(block, 'RIGHT_RPM', Order.ATOMIC) || '0';
    return `robot.set_motor_speeds(${left}, ${right})\n`;
  };

  pythonGenerator.forBlock['robot_get_sensor'] = function (block: Blockly.Block) {
    const sensorId = block.getFieldValue('SENSOR_ID') as string;
    return [`robot.get_sensor('${sensorId}')`, Order.ATOMIC];
  };

  pythonGenerator.forBlock['robot_wall_detected'] = function (block: Blockly.Block) {
    const dir = block.getFieldValue('DIRECTION') as string;
    const threshold = block.getFieldValue('THRESHOLD') as number;
    return [`(0 < robot.get_sensor('${dir}') < ${threshold})`, Order.ATOMIC];
  };
}
