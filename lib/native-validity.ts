import type { FormEvent, InvalidEvent } from 'react';

type ValidityEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** 清空自定义校验，避免挡住后续输入 */
export function clearNativeValidity(e: FormEvent<ValidityEl>) {
  e.currentTarget.setCustomValidity('');
}

/**
 * 浏览器原生 required / type=email 气泡会跟系统语言走；
 * 在 invalid 时改成英文，保证英文站提示一致。
 */
export function englishNativeInvalid(e: InvalidEvent<ValidityEl>) {
  const el = e.currentTarget;
  if (el.validity.valueMissing) {
    el.setCustomValidity('Please fill out this field.');
    return;
  }
  if ('type' in el && el.type === 'email' && el.validity.typeMismatch) {
    el.setCustomValidity('Please enter a valid email address.');
    return;
  }
  if (el.validity.tooShort) {
    el.setCustomValidity(`Please use at least ${el.minLength} characters.`);
    return;
  }
  if (el.validity.tooLong) {
    el.setCustomValidity(`Please use no more than ${el.maxLength} characters.`);
    return;
  }
  if (el.validity.patternMismatch) {
    el.setCustomValidity('Please match the requested format.');
    return;
  }
  el.setCustomValidity('Please check this field.');
}
