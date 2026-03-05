export const vertexShaderWGSL = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>, // The sampled UV within the atlas
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
  @location(2) uvOffset : vec2<f32>, // Atlas u0, v0
  @location(3) uvScale : vec2<f32>,  // Atlas (u1-u0), (v1-v0)
  @location(4) rotation : f32
) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>( 0.5,  0.5)
  );

  var localPos = pos[VertexIndex];

  // Rotation (Z-axis)
  let c = cos(rotation);
  let s = sin(rotation);
  let rotPos = vec2<f32>(
      localPos.x * c - localPos.y * s,
      localPos.x * s + localPos.y * c
  );

  let worldPos = center + (rotPos * size);

  let ndcX = (worldPos.x - uniforms.cameraPos.x) / (uniforms.screenSize.x * 0.5);
  let ndcY = (worldPos.y - uniforms.cameraPos.y) / (uniforms.screenSize.y * 0.5);

  var output : VertexOutput;
  output.position = vec4<f32>(ndcX, -ndcY, 0.0, 1.0);

  // Base UV mapping (0->1)
  let baseUV = pos[VertexIndex] + 0.5;
  // Flip Y for texture sampling (WebGL/WebGPU image coordinates differ slightly, but typically (0,0) is top-left)
  let texUV = vec2<f32>(baseUV.x, 1.0 - baseUV.y);

  // Apply Atlas offset and scale
  output.uv = uvOffset + (texUV * uvScale);

  return output;
}
`;

export const fragmentShaderGBufferWGSL = `
struct FragmentOutput {
  @location(0) albedo : vec4<f32>,
  @location(1) normal : vec4<f32>,
  @location(2) depth : f32,
};

@group(1) @binding(0) var spriteAtlas: texture_2d<f32>;
@group(1) @binding(1) var spriteSampler: sampler;

@fragment
fn main(@location(0) uv : vec2<f32>) -> FragmentOutput {
  let color = textureSample(spriteAtlas, spriteSampler, uv);

  if (color.a < 0.1) {
    discard;
  }

  var output : FragmentOutput;
  output.albedo = color;
  // Simple flat normal pointing at camera for 2D sprites
  output.normal = vec4<f32>(0.5, 0.5, 1.0, 1.0);
  output.depth = 0.5;

  return output;
}
`;

export const fragmentShaderLightingWGSL = `
struct Uniforms {
  screenSize : vec2<f32>,
  cameraPos : vec2<f32>,
  lightPos : vec2<f32>,
  padding : vec2<f32>,
  lightColor : vec3<f32>,
  lightColorPad : f32,
  ambientColor : vec3<f32>,
  ambientColorPad : f32,
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

  // Dynamic Caustics Prototype: Refracted light pool
  // Calculate a "caustic" multiplier based on distance and normal to simulate light refracting.
  let caustic = max(0.0, sin(dist * 0.1) * cos(worldPos.x * 0.05 + worldPos.y * 0.05));
  let isCausticZone = step(50.0, dist) * step(dist, 150.0); // Ring around the light

  // Player absorbs light (darker center shadow), others cast jagged/rainbow caustics
  let causticEffect = caustic * isCausticZone * 0.5;

  // Add the caustic effect to the diffuse lighting, tinted slightly
  let causticColor = vec3<f32>(0.2, 0.4, 0.6) * causticEffect;

  let finalLightColor = uniforms.lightColor + causticColor;

  let lighting = uniforms.ambientColor + (finalLightColor * diffuse * attenuation);

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
    // TODO: Add visual glitch effect (Chromatic Aberration) in PostProcess shader when near Paradox entities.
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
