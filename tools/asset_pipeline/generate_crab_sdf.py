
def generate_crab_sdf():
    """
    Generates the WGSL code for the Scavenger Crab SDF.
    Cinder's Philosophy: "Decay is Detail".
    """

    wgsl_code = """
  } else if (abs(typeID - 3.0) < 0.1) {
    // SCAVENGER CRAB
    // Body: Hexagon shape made of boxes or just a rounded box
    let body = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.25, 0.2));

    // Legs: Wiggling lines
    // Left Legs
    let legL1 = sdBox(uv - vec2<f32>(0.2, 0.4 + sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL2 = sdBox(uv - vec2<f32>(0.2, 0.5 + cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL3 = sdBox(uv - vec2<f32>(0.2, 0.6 + sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));

    // Right Legs
    let legR1 = sdBox(uv - vec2<f32>(0.8, 0.4 - sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR2 = sdBox(uv - vec2<f32>(0.8, 0.5 - cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR3 = sdBox(uv - vec2<f32>(0.8, 0.6 - sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));

    // Claws
    let clawL = sdCircle(uv - vec2<f32>(0.15, 0.3), 0.08);
    let clawR = sdCircle(uv - vec2<f32>(0.85, 0.3), 0.08);

    // Combine Legs
    let legs = min(min(legL1, legL2), legL3);
    legs = min(legs, min(min(legR1, legR2), legR3));

    // Combine All
    dist = min(body, legs);
    dist = min(dist, clawL);
    dist = min(dist, clawR);

    // Color: Rusted Brown/Orange
    color = vec3<f32>(0.7, 0.35, 0.1);
    """
    return wgsl_code

if __name__ == "__main__":
    print(generate_crab_sdf())
