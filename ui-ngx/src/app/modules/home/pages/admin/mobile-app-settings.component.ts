///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { PageComponent } from '@shared/components/page.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasConfirmForm } from '@core/guards/confirm-on-exit.guard';
import { Subject, takeUntil } from 'rxjs';
import { MobileAppService } from '@core/http/mobile-app.service';
import {
  BadgePosition,
  badgePositionTranslationsMap,
  BadgeStyle,
  badgeStyleTranslationsMap,
  MobileAppSettings
} from '@shared/models/mobile.models';

@Component({
  selector: 'tb-mobile-app-settings',
  templateUrl: './mobile-app-settings.component.html',
  styleUrls: ['mobile-app-settings.component.scss', './settings-card.scss']
})
export class MobileAppSettingsComponent extends PageComponent implements HasConfirmForm, OnDestroy {

  mobileAppSettingsForm: FormGroup;

  private mobileAppSettings: MobileAppSettings;

  private readonly destroy$ = new Subject<void>();

  badgePositionTranslationsMap = badgePositionTranslationsMap;
  badgeStyleTranslationsMap = badgeStyleTranslationsMap

  constructor(protected store: Store<AppState>,
              private mobileAppService: MobileAppService,
              public fb: FormBuilder) {
    super(store);
    this.buildMobileAppSettingsForm();
    this.mobileAppService.getMobileAppSettings()
      .subscribe(settings => this.processMobileAppSettings(settings));
    this.mobileAppSettingsForm.get('useDefault').valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value) {
        this.mobileAppSettingsForm.get('androidConfig.appPackage').clearValidators();
        this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').clearValidators();
        this.mobileAppSettingsForm.get('iosConfig.appId').clearValidators();
      } else {
        this.mobileAppSettingsForm.get('androidConfig.appPackage').setValidators([Validators.required]);
        this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').setValidators([Validators.required]);
        this.mobileAppSettingsForm.get('iosConfig.appId').setValidators([Validators.required]);
      }
      this.mobileAppSettingsForm.get('androidConfig.appPackage').updateValueAndValidity();
      this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').updateValueAndValidity();
      this.mobileAppSettingsForm.get('iosConfig.appId').updateValueAndValidity();
    });
    this.mobileAppSettingsForm.get('androidConfig.enabled').valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (!this.mobileAppSettingsForm.get('useDefault').value) {
        if (value) {
          this.mobileAppSettingsForm.get('androidConfig.appPackage').setValidators([Validators.required]);
          this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').setValidators([Validators.required]);
        } else {
          this.mobileAppSettingsForm.get('androidConfig.appPackage').clearValidators();
          this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').clearValidators();
        }
        this.mobileAppSettingsForm.get('androidConfig.appPackage').updateValueAndValidity();
        this.mobileAppSettingsForm.get('androidConfig.sha256CertFingerprints').updateValueAndValidity();
      }
    });
    this.mobileAppSettingsForm.get('iosConfig.enabled').valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (!this.mobileAppSettingsForm.get('useDefault').value) {
        if (value) {
          this.mobileAppSettingsForm.get('iosConfig.appId').setValidators([Validators.required]);
        } else {
          this.mobileAppSettingsForm.get('iosConfig.appId').clearValidators();
        }
        this.mobileAppSettingsForm.get('iosConfig.appId').updateValueAndValidity();
      }
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildMobileAppSettingsForm() {
    this.mobileAppSettingsForm = this.fb.group({
      useDefault: [true, []],
      androidConfig: this.fb.group({
        enabled: [true, []],
        appPackage: ['', []],
        sha256CertFingerprints: ['', []]
      }),
      iosConfig: this.fb.group({
        enabled: [true, []],
        appId: ['', []]
      }),
      qrCodeConfig: this.fb.group({
        showOnHomePage: [true, []],
        badgeEnabled: [true, []],
        badgeStyle: [BadgeStyle.ORIGINAL, []],
        badgePosition: [BadgePosition.RIGHT, []],
        labelEnabled: [true, []],
        qrCodeLabel: ['', []]
      })
    });
  }

  private processMobileAppSettings(mobileAppSettings: MobileAppSettings): void {
    console.log(mobileAppSettings);
    this.mobileAppSettings = {...mobileAppSettings};
    this.mobileAppSettingsForm.reset(this.mobileAppSettings);
  }

  save(): void {
    this.mobileAppSettings = {...this.mobileAppSettings, ...this.mobileAppSettingsForm.getRawValue()};
    this.mobileAppService.saveMobileAppSettings(this.mobileAppSettings)
      .subscribe((settings) => this.processMobileAppSettings(settings))
  }

  discardGeneralSettings(): void {
    this.mobileAppSettingsForm.reset(this.mobileAppSettings);
  }

  confirmForm(): FormGroup {
    return this.mobileAppSettingsForm;
  }

}
