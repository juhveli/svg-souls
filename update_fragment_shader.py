import re

with open("src/shaders/shaders.ts", "r") as f:
    content = f.read()

# Replace the giant procedural fragment shader with a simple texture sampler
new_frag = """
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
"""

content = re.sub(r'export const fragmentShaderGBufferWGSL = `.*?`;', new_frag.strip(), content, flags=re.DOTALL)

with open("src/shaders/shaders.ts", "w") as f:
    f.write(content)
print("Updated fragment shader")
