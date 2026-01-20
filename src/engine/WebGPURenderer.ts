import { vertexShaderWGSL, fragmentShaderGBufferWGSL, fragmentShaderLightingWGSL } from '../shaders/shaders';

export class WebGPURenderer {
    canvas: HTMLCanvasElement;
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipelines
    gBufferPipeline!: GPURenderPipeline;
    lightingPipeline!: GPURenderPipeline;

    // Buffers
    uniformBuffer!: GPUBuffer;
    instanceBuffer!: GPUBuffer;
    lightingUniformBuffer!: GPUBuffer;

    // Textures (G-Buffer)
    albedoTexture!: GPUTexture;
    normalTexture!: GPUTexture;
    depthTexture!: GPUTexture;

    // Bind Groups
    gBufferBindGroup!: GPUBindGroup;
    lightingBindGroup!: GPUBindGroup;

    // Constants
    MAX_INSTANCES = 1000;
    // 9 floats * 4 bytes = 36 bytes.
    INSTANCE_SIZE = 9 * 4;

    // CPU-side Buffers (Optimization: Reuse to avoid GC)
    private instanceData!: Float32Array;
    private uniformDataA!: Float32Array;
    private uniformDataB!: Float32Array;
    private lightingData!: Float32Array;

    private static instance: WebGPURenderer;

    constructor() {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            // It might not exist yet if called too early, but usually init calls it.
        }

        // Initialize CPU-side buffers
        this.instanceData = new Float32Array(this.MAX_INSTANCES * 9);
        this.uniformDataA = new Float32Array(4); // Screen(2) + Camera(2)
        this.uniformDataB = new Float32Array(1); // Time(1)
        this.lightingData = new Float32Array(16); // Lighting Block
    }

    static getInstance(): WebGPURenderer {
        if (!WebGPURenderer.instance) {
            WebGPURenderer.instance = new WebGPURenderer();
        }
        return WebGPURenderer.instance;
    }

    async init(): Promise<void> {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;

        if (!navigator.gpu) {
            console.error("WebGPU not supported.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error("No WebGPU adapter found.");
            return;
        }
        this.adapter = adapter;

        this.device = await adapter.requestDevice();

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        await this.createResources();
        this.createPipelines();

        console.log("WebGPU Renderer Initialized.");
    }

    async createResources() {
        const width = Math.max(1, this.canvas.width);
        const height = Math.max(1, this.canvas.height);

        // 1. G-Buffer Textures
        this.albedoTexture = this.device.createTexture({
            size: [width, height],
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.normalTexture = this.device.createTexture({
            size: [width, height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthTexture = this.device.createTexture({
            size: [width, height],
            format: 'r32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // 2. Uniform Buffer
        // We need 2 blocks:
        // Block A (Vertex): Screen(2) + Camera(2) = 4 floats (16 bytes).
        // Block B (Frag): Time(1) = 1 float (4 bytes).
        // Minimal alignment for uniform buffer offset is usually 256 bytes!
        // So we must offset binding 1 by 256 bytes.

        this.uniformBuffer = this.device.createBuffer({
            size: 512, // Enough for 2 blocks aligned at 256
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Lighting Uniform Buffer
        this.lightingUniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 4. Instance Buffer
        this.instanceBuffer = this.device.createBuffer({
            size: this.MAX_INSTANCES * this.INSTANCE_SIZE,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    }

    createPipelines() {
        // --- G-BUFFER PIPELINE ---
        const gBufferModule = this.device.createShaderModule({
            code: vertexShaderWGSL + "\n" + fragmentShaderGBufferWGSL
        });

        this.gBufferPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: gBufferModule,
                entryPoint: 'main',
                buffers: [{
                    arrayStride: this.INSTANCE_SIZE,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' }, // center
                        { shaderLocation: 1, offset: 8, format: 'float32x2' }, // size
                        { shaderLocation: 2, offset: 16, format: 'float32' },  // typeID
                        { shaderLocation: 3, offset: 20, format: 'float32x4' } // params
                    ]
                }]
            },
            fragment: {
                module: gBufferModule,
                entryPoint: 'main',
                targets: [
                    { format: 'bgra8unorm' }, // Albedo
                    { format: 'rgba8unorm' }, // Normal
                    { format: 'r32float' }    // Depth
                ]
            },
            primitive: { topology: 'triangle-list' }
        });

        this.gBufferBindGroup = this.device.createBindGroup({
            layout: this.gBufferPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 16 } },
                { binding: 1, resource: { buffer: this.uniformBuffer, offset: 256, size: 16 } } // Time
            ]
        });

        // --- LIGHTING PIPELINE ---
        const lightingModule = this.device.createShaderModule({ code: fragmentShaderLightingWGSL });

        this.lightingPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: `
                    @vertex fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
                        var pos = array<vec2<f32>, 6>(
                            vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
                            vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
                        );
                        return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                    }`
                }),
                entryPoint: 'main',
            },
            fragment: {
                module: lightingModule,
                entryPoint: 'main',
                targets: [{ format: this.format }]
            }
        });

        this.lightingBindGroup = this.device.createBindGroup({
            layout: this.lightingPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.lightingUniformBuffer } },
                { binding: 1, resource: this.albedoTexture.createView() },
                { binding: 2, resource: this.normalTexture.createView() },
                { binding: 3, resource: this.depthTexture.createView() },
                { binding: 4, resource: this.device.createSampler() }
            ]
        });
    }

    render(entities: any[], camera: any) {
        // TODO: Phase 4 - Chunking System
        // Instead of a single instanceBuffer for all entities, use per-chunk buffers.
        // Culling: Only upload/render chunks visible to camera.

        // TODO: Phase 5 - Retro Crunch
        // Render to a low-res texture (e.g. 320x180) instead of screen.
        // Add a Post-Process pass to upscale with "Nearest Neighbor" and apply Dithering.

        if (!this.device || !this.context) return;

        const time = performance.now() / 1000;

        // 1. Update Global Uniforms
        // Block A: Screen(2), Camera(2)
        this.uniformDataA[0] = this.canvas.width;
        this.uniformDataA[1] = this.canvas.height;
        this.uniformDataA[2] = camera.x;
        this.uniformDataA[3] = camera.y;
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformDataA);

        // Block B: Time(1) at offset 256
        this.uniformDataB[0] = time;
        this.device.queue.writeBuffer(this.uniformBuffer, 256, this.uniformDataB);

        // 2. Update Lighting Uniforms
        // Layout: Screen(2), Camera(2), LightPos(2), Padding(2), LightColor(3+1), Ambient(3+1)

        let playerX = 0, playerY = 0;
        const player = entities.find(e => e.constructor.name === 'Player');
        if (player) {
            playerX = player.x;
            playerY = player.y;
        }

        this.lightingData[0] = this.canvas.width;
        this.lightingData[1] = this.canvas.height;
        this.lightingData[2] = camera.x;
        this.lightingData[3] = camera.y;
        this.lightingData[4] = playerX;
        this.lightingData[5] = playerY;
        this.lightingData[6] = 0;
        this.lightingData[7] = 0;
        this.lightingData[8] = 1.0;
        this.lightingData[9] = 0.7;
        this.lightingData[10] = 0.4;
        this.lightingData[11] = 0.0;
        this.lightingData[12] = 0.1;
        this.lightingData[13] = 0.15;
        this.lightingData[14] = 0.25;
        this.lightingData[15] = 0.0;
        this.device.queue.writeBuffer(this.lightingUniformBuffer, 0, this.lightingData);

        // 3. Update Instance Buffer
        // Optimization: Use pre-allocated buffer
        const instanceData = this.instanceData;
        let instanceCount = 0;

        for (const e of entities) {
            if (instanceCount >= this.MAX_INSTANCES) break;

            // Extract Render Data (Fallback to existing props)
            const x = e.x || 0;
            const y = e.y || 0;
            const w = e.width || 64;
            const h = e.height || 64;

            // Type Mapping
            let typeID = 0; // Default Box
            const name = e.constructor.name;
            if (name === 'Player') typeID = 1;
            else if (name === 'SerumBot') typeID = 2;
            else if (name === 'ScavengerCrab') typeID = 3;

            // Params
            let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
            if (typeID === 1) {
                // p1 can be used for tentacle phase offset or direction
                // For now, leave 0
            }

            const offset = instanceCount * 9;
            instanceData[offset + 0] = x;
            instanceData[offset + 1] = y;
            instanceData[offset + 2] = w;
            instanceData[offset + 3] = h;
            instanceData[offset + 4] = typeID;
            instanceData[offset + 5] = p1;
            instanceData[offset + 6] = p2;
            instanceData[offset + 7] = p3;
            instanceData[offset + 8] = p4;

            instanceCount++;
        }

        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);

        // 4. Render Passes
        const commandEncoder = this.device.createCommandEncoder();

        // Pass 1: G-Buffer
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.albedoTexture.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.normalTexture.createView(),
                    clearValue: { r: 0.5, g: 0.5, b: 1.0, a: 1.0 }, // Flat normal Z+
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.depthTexture.createView(),
                    clearValue: { r: 0.0, g: 0, b: 0, a: 1.0 }, // Depth init (0?)
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        });

        passEncoder.setPipeline(this.gBufferPipeline);
        passEncoder.setBindGroup(0, this.gBufferBindGroup);
        passEncoder.setVertexBuffer(0, this.instanceBuffer);
        passEncoder.draw(6, instanceCount, 0, 0);
        passEncoder.end();

        // Pass 2: Lighting
        const lightingPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        lightingPass.setPipeline(this.lightingPipeline);
        lightingPass.setBindGroup(0, this.lightingBindGroup);
        lightingPass.draw(6, 1, 0, 0); // Fullscreen
        lightingPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}
