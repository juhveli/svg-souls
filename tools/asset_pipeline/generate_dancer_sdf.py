
def generate_dancer_sdf():
    """
    Generates the WGSL code for the Porcelain Dancer SDF.
    Visuals: Thin, elegant, jointed, glowing.
    """

    wgsl_code = """
  } else if (abs(typeID - 5.0) < 0.1) {
    // PORCELAIN DANCER

    // Visibility Check (p1 passed from Renderer)
    // p1 = 1.0 (Visible), 0.0 (Invisible)
    if (params.x < 0.5) {
        discard;
    }

    // Body (Ellipse-like Box)
    let torso = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.05, 0.15));

    // Head
    let head = sdCircle(uv - vec2<f32>(0.5, 0.25), 0.06);

    // Arms (Pose)
    let armL = sdBox(uv - vec2<f32>(0.35, 0.4), vec2<f32>(0.1, 0.02));
    let armR = sdBox(uv - vec2<f32>(0.65, 0.4), vec2<f32>(0.1, 0.02));

    // Legs (Dress/Cone approximation or legs)
    let dress = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.1, 0.15));

    // Joints (Glowing) - handled by color

    dist = min(torso, head);
    dist = min(dist, armL);
    dist = min(dist, armR);
    dist = min(dist, dress);

    // Color: Porcelain White with Cyan Glow
    color = vec3<f32>(0.9, 0.95, 1.0);

    // Cyan joints/highlights logic could be done by checking UVs,
    // but for now solid color is fine for the base SDF.
    """
    return wgsl_code

if __name__ == "__main__":
    print(generate_dancer_sdf())
