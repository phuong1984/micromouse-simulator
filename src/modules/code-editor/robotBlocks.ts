import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';

let registered = false;

const _sensorOptions = {
  items: [['front', 'front'], ['left', 'left'], ['right', 'right']] as [string, string][],
};

const _wheelOptions = {
  items: [['wheel-left', 'wheel-left'], ['wheel-right', 'wheel-right']] as [string, string][],
};

export function updateSensorDropdowns(ids: string[]): void {
  _sensorOptions.items = ids.length > 0
    ? ids.map(id => [id, id] as [string, string])
    : [['(no sensors)', '']];
}

export function updateWheelDropdowns(ids: string[]): void {
  _wheelOptions.items = ids.length > 0
    ? ids.map(id => [id, id] as [string, string])
    : [['(no wheels)', '']];
}

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
      this.setStyle('robot_movement');
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
      this.setStyle('robot_movement');
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
      this.setStyle('robot_movement');
      this.setTooltip('Stop robot');
    }
  };

  Blockly.Blocks['robot_set_wheel_speed'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Set speed of')
          .appendField(new Blockly.FieldDropdown(() => _wheelOptions.items), 'WHEEL_ID');
      this.appendValueInput('RPM')
          .setCheck('Number')
          .appendField('to');
      this.appendDummyInput()
          .appendField('RPM');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('robot_wheel');
      this.setTooltip('Set speed of a specific wheel');
    }
  };

  Blockly.Blocks['robot_get_sensor'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Get Distance [mm] from')
          .appendField(new Blockly.FieldDropdown(() => _sensorOptions.items), 'SENSOR_ID');
      this.setOutput(true, 'Number');
      this.setStyle('robot_sensor');
      this.setTooltip('Get distance from sensor (mm), -1 if none');
    }
  };

  Blockly.Blocks['robot_wall_detected'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Wall Detected at')
          .appendField(new Blockly.FieldDropdown(() => _sensorOptions.items), 'DIRECTION')
          .appendField('within')
          .appendField(new Blockly.FieldNumber(100, 10, 500), 'THRESHOLD')
          .appendField('mm');
      this.setOutput(true, 'Boolean');
      this.setStyle('robot_sensor');
      this.setTooltip('Check if wall is detected');
    }
  };

  Blockly.Blocks['robot_log'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .appendField('Print');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('robot_sensor');
      this.setTooltip('Print a value to the console');
    }
  };

  Blockly.Blocks['robot_at_goal'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('At Goal?');
      this.setOutput(true, 'Boolean');
      this.setStyle('robot_sensor');
      this.setTooltip('Check if robot has reached the goal');
    }
  };

  // --- Python Generators ---

  pythonGenerator.forBlock['robot_move'] = function (block: Blockly.Block) {
    const distance = pythonGenerator.valueToCode(block, 'DISTANCE', Order.ATOMIC) || '180';
    return `await robot.move(${distance})\n`;
  };

  pythonGenerator.forBlock['robot_turn'] = function (block: Blockly.Block) {
    const dir = block.getFieldValue('DIRECTION') as string;
    const angle = block.getFieldValue('ANGLE') as number;
    const signedAngle = dir === 'LEFT' ? -angle : angle;
    return `await robot.turn(${signedAngle})\n`;
  };

  pythonGenerator.forBlock['robot_stop'] = function (_block: Blockly.Block) {
    return `robot.stop()\n`;
  };

  pythonGenerator.forBlock['robot_set_wheel_speed'] = function (block: Blockly.Block) {
    const wheelId = block.getFieldValue('WHEEL_ID') as string;
    const rpm = pythonGenerator.valueToCode(block, 'RPM', Order.ATOMIC) || '0';
    return `robot.set_wheel_speed('${wheelId}', ${rpm})\n`;
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

  pythonGenerator.forBlock['robot_log'] = function (block: Blockly.Block) {
    const value = pythonGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || "''";
    return `robot.log(${value})\n`;
  };

  pythonGenerator.forBlock['robot_at_goal'] = function (_block: Blockly.Block) {
    return ['robot.at_goal()', Order.ATOMIC];
  };
}
