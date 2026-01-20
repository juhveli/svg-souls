
def generate_golgotha_sdf():
    """
    Generates the WGSL code for the Golgotha (World 1 Boss) SDF.
    Visuals: A massive, shifting blob of scrap.
    """

    wgsl_code = """
  } else if (abs(typeID - 4.0) < 0.1) {
    // GOLGOTHA (The Accumulation)
    // A large, wobbling mass.

    // Main Body (Throbbing Blob)
    let wobble = sin(global.time * 2.0 + uv.y * 10.0) * 0.05;
    let body = sdCircle(uv - vec2<f32>(0.5 + wobble * 0.5, 0.5), 0.3 + wobble);

    // Scrap Pieces (Sticking out)
    let scrap1 = sdBox(uv - vec2<f32>(0.3, 0.7), vec2<f32>(0.1, 0.05)); // Plate
    let scrap2 = sdBox(uv - vec2<f32>(0.7, 0.3), vec2<f32>(0.05, 0.15)); // Pipe
    let scrap3 = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.1); // Core

    // Combine (Union)
    dist = min(body, scrap1);
    dist = min(dist, scrap2);

    // Subtractive "Mouth" or Void
    let mouth = sdCircle(uv - vec2<f32>(0.5, 0.4), 0.1 + sin(global.time * 5.0) * 0.02);
    dist = max(dist, -mouth);

    // Color: Molten Orange/Brown/Rust
    // Pulse color based on time
    let pulse = sin(global.time * 3.0) * 0.2 + 0.8;
    color = vec3<f32>(0.6 * pulse, 0.3, 0.1);
    """
    return wgsl_code

if __name__ == "__main__":
    print(generate_golgotha_sdf())
