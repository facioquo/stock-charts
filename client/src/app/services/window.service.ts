import { Injectable } from '@angular/core';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private resizeSubject = new Subject<{ width: number; height: number }>();
  
  constructor() {
    // Listen for window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.resizeSubject.next({
          width: window.innerWidth,
          height: window.innerHeight
        });
      });
    }
  }

  /**
   * Get window dimensions
   */
  getWindowSize(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return { width: 1024, height: 768 }; // Default for SSR
  }

  /**
   * Observable for window resize events with debouncing
   */
  getResizeObservable(): Observable<{ width: number; height: number }> {
    return this.resizeSubject.pipe(
      debounceTime(150), // 150ms delay for responsive UX while avoiding excess recalculations
      distinctUntilChanged((prev, curr) => 
        prev.width === curr.width && prev.height === curr.height
      )
    );
  }

  /**
   * Calculate optimal number of bars based on window width
   * Using ~5px per bar as specified in requirements
   */
  calculateOptimalBars(containerWidth?: number): number {
    const width = containerWidth || this.getWindowSize().width;
    const pixelsPerBar = 5;
    const minBars = 20; // Minimum reasonable number of bars
    const maxBars = 500; // Maximum to avoid performance issues
    
    const calculatedBars = Math.floor(width / pixelsPerBar);
    return Math.max(minBars, Math.min(maxBars, calculatedBars));
  }
}