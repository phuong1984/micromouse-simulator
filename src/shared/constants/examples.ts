export interface ExampleProgram {
  id: string;
  name: string;
  description: string;
  code: string;
  suggestedMaze: '5x5' | '8x8' | '16x16';
}

export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  {
    id: 'wall-follower-left',
    name: 'Left Wall Follower',
    description: 'Keep the left wall in contact. Turn left if open, go straight if blocked, turn right as last resort.',
    suggestedMaze: '8x8',
    code: `async def solve():
    while not robot.at_goal():
        sensor_front = robot.get_sensor('front')
        sensor_left = robot.get_sensor('left')
        sensor_right = robot.get_sensor('right')
        if sensor_left < 0:
            await robot.turn(-90)
            await robot.move(180)
        elif sensor_front < 0:
            await robot.move(180)
        elif sensor_right < 0:
            await robot.turn(90)
            await robot.move(180)
        else:
            await robot.turn(180)
            await robot.move(180)

await solve()`,
  },
  {
    id: 'wall-follower-right',
    name: 'Right Wall Follower',
    description: 'Keep the right wall in contact. Turn right if open, go straight if blocked, turn left as last resort.',
    suggestedMaze: '8x8',
    code: `async def solve():
    while not robot.at_goal():
        sensor_front = robot.get_sensor('front')
        sensor_left = robot.get_sensor('left')
        sensor_right = robot.get_sensor('right')
        if sensor_right < 0:
            await robot.turn(90)
            await robot.move(180)
        elif sensor_front < 0:
            await robot.move(180)
        elif sensor_left < 0:
            await robot.turn(-90)
            await robot.move(180)
        else:
            await robot.turn(180)
            await robot.move(180)

await solve()`,
  },
  {
    id: 'explorer',
    name: 'Simple Explorer',
    description: 'Move freely: prioritize going straight, turn when encountering a wall.',
    suggestedMaze: '5x5',
    code: `async def solve():
    while not robot.at_goal():
        front = robot.get_sensor('front')
        left = robot.get_sensor('left')
        right = robot.get_sensor('right')

        if front < 0:
            await robot.move(180)
        elif left < 0:
            await robot.turn(-90)
            await robot.move(180)
        elif right < 0:
            await robot.turn(90)
            await robot.move(180)
        else:
            await robot.turn(180)

await solve()`,
  },
  {
    id: 'straight-line',
    name: 'Straight Line Test',
    description: 'Move straight until hitting a wall or reaching the goal.',
    suggestedMaze: '5x5',
    code: `async def solve():
    while not robot.at_goal():
        front = robot.get_sensor('front')
        if front < 0:
            await robot.move(180)
        else:
            await robot.turn(90)

await solve()`,
  },
  {
    id: 'manual-motors',
    name: 'Manual Motor Control',
    description: 'Control each motor directly using set_wheel_speed() for differential drive.',
    suggestedMaze: '5x5',
    code: `async def solve():
    robot.log("Running manual motor control...")

    # Move forward
    robot.set_wheel_speed('wheel-left', 400)
    robot.set_wheel_speed('wheel-right', 400)
    await robot.move(180)

    # Turn right on the spot
    robot.set_wheel_speed('wheel-left', 300)
    robot.set_wheel_speed('wheel-right', -300)
    await robot.turn(90)

    # Stop
    robot.stop()

await solve()`,
  },
];
