import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy, signal,
  Signal,
  viewChild,
} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls, GLTFLoader} from 'three-stdlib';
import {Scene} from 'three';

@Component({
  selector: 'app-map-three',
  standalone: true,
  templateUrl: './map-three.component.html',
  styleUrl: './map-three.component.scss',
})
export class MapThreeComponent implements AfterViewInit, OnDestroy {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>> = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas3d');

  private readonly renderer = signal<THREE.WebGLRenderer | undefined>(undefined);
  private readonly scene = signal<THREE.Scene | undefined>(undefined);

  /* private camera: THREE.PerspectiveCamera | undefined;*/
  private readonly camera = signal<THREE.PerspectiveCamera | undefined>(undefined);
  private controls: OrbitControls | undefined;
  private animationId: number | null = null;

  ngAfterViewInit(): void {
    this.initThree();
    this.loadScene();
    this.startLoop();
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.renderer()?.dispose();
  }

  private initThree() {
    // 1. Renderer
    this.renderer.set(new THREE.WebGLRenderer({
      canvas: this.canvasRef().nativeElement,
      antialias: true,
    }));
    this.renderer()?.setPixelRatio(window.devicePixelRatio);
    this.onResize();

    // 2. Scene
    this.scene.set(new THREE.Scene());
    //this.scene.update((value: THREE.Scene) => value.background = new THREE.Color(0xeeeeee))

    this.scene()!.background = new THREE.Color(0xeeeeee);

    this.scene.update((prevScene: THREE.Scene | undefined): Scene | undefined => {
      prevScene!.background = new THREE.Color(0xeeeeee);
      return prevScene;
    });

    // 3. Camera
    const width: number = this.canvasRef().nativeElement.clientWidth;
    const height: number = this.canvasRef().nativeElement.clientHeight;
    this.camera.set(new THREE.PerspectiveCamera(60, width / height, 0.1, 1000));
    this.camera.update((prevCamera: THREE.PerspectiveCamera | undefined): THREE.PerspectiveCamera | undefined => {
      prevCamera?.position.set(5, 5, 5);
      return prevCamera;
    });


    // 4. Controls
    this.controls = new OrbitControls(this.camera()!, this.renderer()?.domElement);
    this.controls.enableDamping = true;

    // 5. Luces
    // AmbientLight: ilumina uniformemente toda la escena
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);

    // DirectionalLight: simula luz solar, puede proyectar sombras
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;

    // 6. GridHelper (suelo de referencia)
    const grid = new THREE.GridHelper(10, 10);

    this.scene.update((prevScene: THREE.Scene | undefined): Scene | undefined => {
      prevScene?.add(ambient);
      prevScene?.add(sun);
      prevScene?.add(grid);
      return prevScene;
    });
  }

  private loadScene() {
    // Prueba inicial: un cubo que reacciona a la luz
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({color: 0xff6600});
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    this.scene.update((prevScene: THREE.Scene | undefined): Scene | undefined => {
      prevScene?.add(cube);
      return prevScene;
    })

    // Para mas adelante cargar otro glTF:
    // const loader = new GLTFLoader();
    // loader.load('assets/models/mi_mapa.gltf', gltf => {
    //   this.scene.add(gltf.scene);
    // });
  }

  private startLoop() {
    const tick = () => {
      this.animationId = requestAnimationFrame(tick);
      this.controls?.update();
      const scene = this.scene();
      const camera = this.camera();

      if (scene && camera) {
        this.renderer()?.render(scene, camera);
      }
    };
    tick();
  }

  @HostListener('window:resize')
  onResize() {
    const canvas: HTMLCanvasElement = this.canvasRef().nativeElement;
    //Se pasa falso al atributo updateStyle para que no se actualice el tamaño del canvas
    this.renderer()?.setSize(canvas.clientWidth, canvas.clientHeight, false);

    if (this.camera()) {
      this.camera.update((prevCamera: THREE.PerspectiveCamera | undefined): THREE.PerspectiveCamera | undefined => {
        prevCamera!.aspect = canvas.clientWidth / canvas.clientHeight;
        prevCamera?.updateProjectionMatrix();
        return prevCamera;
      });
    }
  }
}
