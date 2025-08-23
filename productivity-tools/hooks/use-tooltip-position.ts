import { useState, useEffect, useCallback, RefObject } from 'react';

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform?: string;
}

export function useTooltipPosition(
  targetRef: RefObject<HTMLElement>,
  tooltipRef: RefObject<HTMLElement>,
  isVisible: boolean
) {
  const [position, setPosition] = useState<TooltipPosition>({});

  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current || !isVisible) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 8; // ツールチップとターゲット要素の間のマージン
    const newPosition: TooltipPosition = {};

    // 水平位置の計算
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const tooltipHalfWidth = tooltipRect.width / 2;

    // デフォルトは中央配置
    let leftPosition = targetCenterX - tooltipHalfWidth;
    
    // 左端チェック
    if (leftPosition < margin) {
      leftPosition = margin;
      newPosition.transform = 'translateX(0)';
    } 
    // 右端チェック
    else if (leftPosition + tooltipRect.width > viewportWidth - margin) {
      leftPosition = viewportWidth - tooltipRect.width - margin;
      newPosition.transform = 'translateX(0)';
    } 
    // 中央配置
    else {
      leftPosition = targetRect.left + targetRect.width / 2;
      newPosition.transform = 'translateX(-50%)';
    }

    newPosition.left = leftPosition;

    // 垂直位置の計算
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const tooltipHeight = tooltipRect.height;

    // 上に表示するスペースがあるか確認
    if (spaceAbove > tooltipHeight + margin) {
      // 上に表示
      newPosition.bottom = viewportHeight - targetRect.top + margin;
    } 
    // 下に表示するスペースがあるか確認
    else if (spaceBelow > tooltipHeight + margin) {
      // 下に表示
      newPosition.top = targetRect.bottom + margin;
    } 
    // どちらにも十分なスペースがない場合は、より広い方に表示
    else {
      if (spaceAbove > spaceBelow) {
        newPosition.bottom = viewportHeight - targetRect.top + margin;
      } else {
        newPosition.top = targetRect.bottom + margin;
      }
    }

    setPosition(newPosition);
  }, [targetRef, tooltipRef, isVisible]);

  useEffect(() => {
    calculatePosition();

    if (isVisible) {
      // リサイズやスクロール時に再計算
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);

      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [calculatePosition, isVisible]);

  return position;
}