import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "./useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("startedAt이 null이면 durationSec 그대로 반환", () => {
    const { result } = renderHook(() =>
      useTimer({ startedAt: null, durationSec: 60 })
    );

    expect(result.current.remainingSec).toBe(60);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.progress).toBe(1);
  });

  it("시작 직후 → 전체 시간에 가까운 값 반환", () => {
    const startedAt = new Date().toISOString();

    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 30 })
    );

    // 즉시 체크: 30초 혹은 가까운 값
    expect(result.current.remainingSec).toBeGreaterThanOrEqual(29);
    expect(result.current.remainingSec).toBeLessThanOrEqual(30);
    expect(result.current.isExpired).toBe(false);
  });

  it("시간 경과 후 remainingSec 감소", () => {
    const startedAt = new Date().toISOString();

    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 30 })
    );

    act(() => {
      vi.advanceTimersByTime(10000); // 10초 경과
    });

    expect(result.current.remainingSec).toBeLessThanOrEqual(20);
  });

  it("타이머 만료 시 remainingSec = 0, isExpired = true", () => {
    const startedAt = new Date().toISOString();

    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 10 })
    );

    act(() => {
      vi.advanceTimersByTime(11000); // 11초 경과 (만료)
    });

    expect(result.current.remainingSec).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.progress).toBe(0);
  });

  it("만료 시 onExpire 콜백 정확히 1회 호출", () => {
    const onExpire = vi.fn();
    const startedAt = new Date().toISOString();

    renderHook(() =>
      useTimer({ startedAt, durationSec: 5, onExpire })
    );

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("만료 후 추가 tick에서 onExpire 중복 호출 없음", () => {
    const onExpire = vi.fn();
    const startedAt = new Date().toISOString();

    renderHook(() =>
      useTimer({ startedAt, durationSec: 5, onExpire })
    );

    act(() => {
      vi.advanceTimersByTime(6000);  // 만료
      vi.advanceTimersByTime(5000);  // 추가 경과
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("progress는 0~1 범위", () => {
    const startedAt = new Date().toISOString();

    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 20 })
    );

    expect(result.current.progress).toBeGreaterThanOrEqual(0);
    expect(result.current.progress).toBeLessThanOrEqual(1);

    act(() => {
      vi.advanceTimersByTime(25000); // 만료
    });

    expect(result.current.progress).toBe(0);
  });

  it("startedAt 변경 시 타이머 리셋", () => {
    const startedAt1 = new Date().toISOString();
    let startedAt = startedAt1;

    const { result, rerender } = renderHook(() =>
      useTimer({ startedAt, durationSec: 30 })
    );

    act(() => {
      vi.advanceTimersByTime(15000); // 15초 경과
    });

    expect(result.current.remainingSec).toBeLessThanOrEqual(15);

    // startedAt 리셋
    act(() => {
      startedAt = new Date().toISOString();
      rerender();
    });

    expect(result.current.remainingSec).toBeGreaterThanOrEqual(29);
  });
});
