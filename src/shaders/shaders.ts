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
  // Note: WebGPU Clip Space is [-1, 1]. Y-axis is up (1) to down (-1) typically?
  // Wait, WebGPU clip space Y is -1 (bottom) to 1 (top).
  // Screen coords: 0,0 (top-left) -> 800,600 (bottom-right).
  // x: 0 -> -1, 800 -> 1
  // y: 0 -> 1, 600 -> -1

  let ndcX = (worldPos.x - uniforms.cameraPos.x) / (uniforms.screenSize.x * 0.5); // Range approx -1 to 1 centered
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
    // Simple representation: Circle head + simple pulsing body
    let head = sdCircle(uv - vec2<f32>(0.5, 0.3), 0.15);

    // Tentacle Wobble
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
  // We want the center to point to Z+, edges to bend away.
  let edgeDist = clamp(abs(dist) * 5.0, 0.0, 1.0);
  // If edgeDist is 0 (far from center?), wait.
  // dist is negative inside. center is most negative. edge is 0.
  // So -dist is positive.
  // Center: -dist large. Edge: -dist small.

  // Let's model a spherical cap.
  // n.z = sqrt(1 - x^2 - y^2) roughly.
  // Here we cheat.
  normalVec = normalize(vec3<f32>((uv.x - 0.5) * 2.0, (uv.y - 0.5) * 2.0, 0.5));

  var output : FragmentOutput;
  output.albedo = vec4<f32>(color, 1.0);
  output.normal = vec4<f32>(normalVec * 0.5 + 0.5, 1.0);
  output.depth = 0.5; // Placeholder

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
  let uv = coord.xy / uniforms.screenSize;

  let albedo = textureSample(albedoTex, samp, uv);

  if (albedo.a < 0.1) {
    return vec4<f32>(0.02, 0.02, 0.03, 1.0); // Dark ambient background
  }

  let normalEncoded = textureSample(normalTex, samp, uv);
  let normal = normalize((normalEncoded.xyz - 0.5) * 2.0);

  // Reconstruct World Position
  let ndc = (uv * 2.0) - 1.0;
  // Remember Y flip
  // ndc.y is -1 (top) to 1 (bottom) in UV? No, UV is 0 (top) to 1 (bottom).
  // ndc.y = (0 * 2) - 1 = -1.

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
