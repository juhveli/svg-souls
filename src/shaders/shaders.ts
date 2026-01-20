export const vertexShaderWGSL = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) typeID : f32,
  @location(2) params : vec4<f32>,
};

struct Uniforms {
  screenSize : vec2<f32>,
  cameraPos : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32,
  @location(0) center : vec2<f32>,
  @location(1) size : vec2<f32>,
  @location(2) typeID : f32,
  @location(3) params : vec4<f32>
) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>( 0.5,  0.5)
  );

  var output : VertexOutput;
  output.uv = pos[VertexIndex] + 0.5; // 0.0 to 1.0

  let worldPos = center + (pos[VertexIndex] * size);

  // Camera Transform
  // screenSize in uniforms is the Logical Screen Size (Canvas Size)
  // This preserves the FoV regardless of the actual render target resolution (Low Res)

  let ndcX = (worldPos.x - uniforms.cameraPos.x) / (uniforms.screenSize.x * 0.5);
  let ndcY = (worldPos.y - uniforms.cameraPos.y) / (uniforms.screenSize.y * 0.5);

  // Flip Y because Screen Y+ is Down, Clip Y+ is Up.
  output.position = vec4<f32>(ndcX, -ndcY, 0.0, 1.0);
  output.typeID = typeID;
  output.params = params;

  return output;
}
`;

export const fragmentShaderGBufferWGSL = `
struct FragmentOutput {
  @location(0) albedo : vec4<f32>,
  @location(1) normal : vec4<f32>,
  @location(2) depth : f32,
};

struct GlobalUniforms {
  time : f32,
};
@group(0) @binding(1) var<uniform> global : GlobalUniforms;

fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
    return length(p) - r;
}

fn sdBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
    let d = abs(p) - b;
    return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

@fragment
fn main(
  @location(0) uv : vec2<f32>,
  @location(1) typeID : f32,
  @location(2) params : vec4<f32>
) -> FragmentOutput {
  var dist : f32 = 1.0;
  var color : vec3<f32> = vec3<f32>(0.0);
  var normalVec : vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

  // --- 1. SDF LOGIC ---
  if (abs(typeID - 1.0) < 0.1) {
    // HERO
    let head = sdCircle(uv - vec2<f32>(0.5, 0.3), 0.15);
    let wobble = sin((uv.y * 20.0) + (global.time * 5.0)) * 0.05 * uv.y;
    let body = sdBox(uv - vec2<f32>(0.5 + wobble, 0.6), vec2<f32>(0.1, 0.2));
    dist = min(head, body);
    color = vec3<f32>(0.0, 1.0, 1.0); // Cyan Resonance

  } else if (abs(typeID - 2.0) < 0.1) {
    // SERUM BOT
    let box = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.3, 0.3));
    let hole = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.15);
    dist = max(box, -hole);
    color = vec3<f32>(0.8, 0.4, 0.1); // Rust

  } else if (abs(typeID - 3.0) < 0.1) {
    // SCAVENGER CRAB
    let body = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.25, 0.2));
    let legL1 = sdBox(uv - vec2<f32>(0.2, 0.4 + sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL2 = sdBox(uv - vec2<f32>(0.2, 0.5 + cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL3 = sdBox(uv - vec2<f32>(0.2, 0.6 + sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR1 = sdBox(uv - vec2<f32>(0.8, 0.4 - sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR2 = sdBox(uv - vec2<f32>(0.8, 0.5 - cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR3 = sdBox(uv - vec2<f32>(0.8, 0.6 - sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));
    let clawL = sdCircle(uv - vec2<f32>(0.15, 0.3), 0.08);
    let clawR = sdCircle(uv - vec2<f32>(0.85, 0.3), 0.08);

    let legs = min(min(legL1, legL2), legL3);
    legs = min(legs, min(min(legR1, legR2), legR3));
    dist = min(body, legs);
    dist = min(dist, clawL);
    dist = min(dist, clawR);
    color = vec3<f32>(0.7, 0.35, 0.1);

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

  } else if (abs(typeID - 6.0) < 0.1) {
    // RUST MITE (High Fidelity)
    // Small, jittery, multi-legged.

    // 1. Body: Segmented, slightly wobbling
    let wobble = sin(global.time * 20.0) * 0.02;
    let bodyMain = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.15);
    let bodyBack = sdCircle(uv - vec2<f32>(0.5 + wobble, 0.4), 0.12);
    let bodyHead = sdCircle(uv - vec2<f32>(0.5 - wobble, 0.6), 0.1);

    // 2. Legs: Fast movement
    let legWiggle = sin(global.time * 30.0 + uv.x * 20.0) * 0.05;
    let legsL = sdBox(uv - vec2<f32>(0.3 + legWiggle, 0.5), vec2<f32>(0.1, 0.15));
    let legsR = sdBox(uv - vec2<f32>(0.7 + legWiggle, 0.5), vec2<f32>(0.1, 0.15));

    dist = min(bodyMain, bodyBack);
    dist = min(dist, bodyHead);
    dist = min(dist, legsL);
    dist = min(dist, legsR);

    // Color: Rust + Blood Dry
    color = vec3<f32>(0.31, 0.20, 0.16); // Rust

  } else if (typeID > 6.5) {
     // TODO: Implement High Fidelity SDF for IDs 7-20
     // RustDragon (7), VanityWraith (8), RazorVine (9), Vitria (10), Narcissus (11)
     // GearKeeper (12), MetronomeGeneral (13), ChronoWraith (14)
     // SilenceGuard (15), Cantor (16), Banshee (17)
     // PrimeConductor (18), Paradox (19)
     discard;

  } else {
    // DEFAULT CUBE
    dist = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.4, 0.4));
    color = vec3<f32>(0.5, 0.5, 0.5);
  }

  // --- 2. RENDER ---
  if (dist > 0.0) {
    discard;
  }

  // Fake Normal Calculation
  normalVec = normalize(vec3<f32>((uv.x - 0.5) * 2.0, (uv.y - 0.5) * 2.0, 0.5));

  var output : FragmentOutput;
  output.albedo = vec4<f32>(color, 1.0);
  output.normal = vec4<f32>(normalVec * 0.5 + 0.5, 1.0);
  output.depth = 0.5;

  return output;
}
`;

export const fragmentShaderLightingWGSL = `
struct Uniforms {
  screenSize : vec2<f32>,
  cameraPos : vec2<f32>,
  lightPos : vec2<f32>,
  lightColor : vec3<f32>,
  ambientColor : vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var albedoTex : texture_2d<f32>;
@group(0) @binding(2) var normalTex : texture_2d<f32>;
@group(0) @binding(3) var depthTex : texture_2d<f32>;
@group(0) @binding(4) var samp : sampler;

@fragment
fn main(@builtin(position) coord : vec4<f32>) -> @location(0) vec4<f32> {
  // Use texture dimensions for UV calc to be resolution independent
  let dims = vec2<f32>(textureDimensions(albedoTex));
  let uv = coord.xy / dims;

  let albedo = textureSample(albedoTex, samp, uv);

  if (albedo.a < 0.1) {
    return vec4<f32>(0.02, 0.02, 0.03, 1.0); // Dark ambient background
  }

  let normalEncoded = textureSample(normalTex, samp, uv);
  let normal = normalize((normalEncoded.xyz - 0.5) * 2.0);

  // Reconstruct World Position
  // We use the Uniform ScreenSize (High Res) for this projection math
  // because the G-Buffer was rendered using that projection.
  // The 'uv' variable here runs 0..1 across the low-res texture,
  // which corresponds to 0..1 across the high-res screen logically.

  let ndc = (uv * 2.0) - 1.0;

  let worldPos = vec2<f32>(
     (ndc.x * uniforms.screenSize.x * 0.5) + uniforms.cameraPos.x,
     (-ndc.y * uniforms.screenSize.y * 0.5) + uniforms.cameraPos.y
  );

  let lightDir = uniforms.lightPos - worldPos;
  let dist = length(lightDir);

  let lightDir3D = normalize(vec3<f32>(lightDir.x, lightDir.y, 50.0));

  let diffuse = max(dot(normal, lightDir3D), 0.0);

  let attenuation = 1.0 / (1.0 + 0.005 * dist + 0.0001 * dist * dist);

  let lighting = uniforms.ambientColor + (uniforms.lightColor * diffuse * attenuation);

  return vec4<f32>(albedo.rgb * lighting, 1.0);
}
`;

export const vertexShaderFullscreenWGSL = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex fn main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
  );
  var output : VertexOutput;
  output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);

  // Map Clip Space (-1..1) to UV (0..1)
  // Flip Y: Clip Y=1 (Top) -> UV Y=0. Clip Y=-1 (Bottom) -> UV Y=1.
  output.uv = vec2<f32>(pos[VertexIndex].x * 0.5 + 0.5, 0.5 - pos[VertexIndex].y * 0.5);

  return output;
}
`;

export const fragmentShaderPostProcessWGSL = `
@group(0) @binding(0) var lightingTex : texture_2d<f32>;
@group(0) @binding(1) var samp : sampler;

fn getBayer(x: i32, y: i32) -> f32 {
    let m = array<i32, 16>(
        0, 8, 2, 10,
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
    );
    let idx = (y % 4) * 4 + (x % 4);
    return f32(m[idx]) / 16.0 - 0.5;
}

fn getNearestGloomColor(col: vec3<f32>) -> vec3<f32> {
    var palette = array<vec3<f32>, 16>(
        vec3<f32>(0.0196, 0.0196, 0.0196), // Void
        vec3<f32>(0.0588, 0.0784, 0.0588), // Deep Shadow
        vec3<f32>(0.0980, 0.1373, 0.0980), // Swamp Green
        vec3<f32>(0.1569, 0.1961, 0.1569), // Dark Moss
        vec3<f32>(0.2353, 0.1569, 0.1176), // Rusted Iron
        vec3<f32>(0.3137, 0.1961, 0.1569), // Rust
        vec3<f32>(0.3922, 0.2745, 0.1961), // Clay
        vec3<f32>(0.4706, 0.3529, 0.2745), // Old Wood
        vec3<f32>(0.3922, 0.3922, 0.4314), // Cold Stone
        vec3<f32>(0.5098, 0.5098, 0.5098), // Grey
        vec3<f32>(0.6275, 0.6275, 0.5882), // Old Bone
        vec3<f32>(0.7843, 0.7843, 0.7451), // Pale Bone
        vec3<f32>(0.1961, 0.0392, 0.0392), // Blood Dry
        vec3<f32>(0.4706, 0.0784, 0.0784), // Blood Fresh
        vec3<f32>(0.0392, 0.1176, 0.1961), // Magic Dark
        vec3<f32>(0.1961, 0.5882, 0.7843)  // Magic Bright
    );

    var minDist = 100.0; // Large number
    var bestColor = palette[0];

    for (var i = 0; i < 16; i++) {
        let p = palette[i];
        let d = distance(col, p);
        if (d < minDist) {
            minDist = d;
            bestColor = p;
        }
    }
    return bestColor;
}

@fragment
fn main(@builtin(position) coord : vec4<f32>, @location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
    // Sample texture with nearest sampler (passed in bind group)
    let color = textureSample(lightingTex, samp, uv).rgb;

    // Apply Dither
    let dither = getBayer(i32(coord.x), i32(coord.y));
    let ditheredColor = color + vec3<f32>(dither * 0.15); // Adjust spread as needed

    // Quantize
    let finalColor = getNearestGloomColor(ditheredColor);

    return vec4<f32>(finalColor, 1.0);
}
`;
