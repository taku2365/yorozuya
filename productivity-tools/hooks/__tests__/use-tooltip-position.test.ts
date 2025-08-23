import { renderHook, act } from '@testing-library/react';
import { useTooltipPosition } from '../use-tooltip-position';
import { RefObject } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useTooltipPosition', () => {
  let targetRef: RefObject<HTMLElement>;
  let tooltipRef: RefObject<HTMLElement>;

  beforeEach(() => {
    // モックエレメントの作成
    targetRef = {
      current: {
        getBoundingClientRect: vi.fn(() => ({
          left: 100,
          top: 100,
          right: 200,
          bottom: 130,
          width: 100,
          height: 30,
        })),
      } as unknown as HTMLElement,
    };

    tooltipRef = {
      current: {
        getBoundingClientRect: vi.fn(() => ({
          left: 0,
          top: 0,
          right: 200,
          bottom: 50,
          width: 200,
          height: 50,
        })),
      } as unknown as HTMLElement,
    };

    // window のモック
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('should position tooltip above target when there is enough space', () => {
    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    expect(result.current.bottom).toBeDefined();
    expect(result.current.top).toBeUndefined();
    expect(result.current.left).toBeDefined();
    expect(result.current.transform).toBe('translateX(-50%)');
  });

  it('should position tooltip below target when there is no space above', () => {
    // ターゲットを画面上部に配置
    targetRef.current!.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 20,
      right: 200,
      bottom: 50,
      width: 100,
      height: 30,
    }));

    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    expect(result.current.top).toBeDefined();
    expect(result.current.bottom).toBeUndefined();
  });

  it('should adjust horizontal position when tooltip would overflow left edge', () => {
    // ターゲットを画面左端に配置
    targetRef.current!.getBoundingClientRect = vi.fn(() => ({
      left: 10,
      top: 100,
      right: 110,
      bottom: 130,
      width: 100,
      height: 30,
    }));

    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    expect(result.current.left).toBe(8); // margin
    expect(result.current.transform).toBe('translateX(0)');
  });

  it('should adjust horizontal position when tooltip would overflow right edge', () => {
    // ターゲットを画面右端に配置
    targetRef.current!.getBoundingClientRect = vi.fn(() => ({
      left: 900,
      top: 100,
      right: 1000,
      bottom: 130,
      width: 100,
      height: 30,
    }));

    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    expect(result.current.left).toBe(816); // window.innerWidth - tooltipWidth - margin
    expect(result.current.transform).toBe('translateX(0)');
  });

  it('should not calculate position when tooltip is not visible', () => {
    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, false)
    );

    expect(result.current).toEqual({});
  });

  it('should recalculate position on window resize', () => {
    const { result, rerender } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    const initialPosition = { ...result.current };

    // ウィンドウサイズを変更
    act(() => {
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));
    });

    rerender();

    // 右端に近い場合、位置が調整されることを確認
    targetRef.current!.getBoundingClientRect = vi.fn(() => ({
      left: 700,
      top: 100,
      right: 800,
      bottom: 130,
      width: 100,
      height: 30,
    }));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.left).not.toBe(initialPosition.left);
  });

  it('should recalculate position on scroll', () => {
    const { result } = renderHook(() =>
      useTooltipPosition(targetRef, tooltipRef, true)
    );

    const initialPosition = { ...result.current };

    // スクロール後の位置を変更
    targetRef.current!.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 50, // スクロール後の位置
      right: 200,
      bottom: 80,
      width: 100,
      height: 30,
    }));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.bottom).not.toBe(initialPosition.bottom);
  });

  it('should handle missing refs gracefully', () => {
    const emptyRef = { current: null };
    
    const { result } = renderHook(() =>
      useTooltipPosition(emptyRef as RefObject<HTMLElement>, tooltipRef, true)
    );

    expect(result.current).toEqual({});
  });
});