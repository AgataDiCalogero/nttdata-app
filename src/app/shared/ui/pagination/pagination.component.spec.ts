import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PaginationComponent } from './pagination.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginationComponent],
  template: `<app-pagination [page]="page" [pageCount]="pageCount"></app-pagination>`,
})
class PaginationHostComponent {
  page = 1;
  pageCount = 1;
}

describe('PaginationComponent', () => {
  let hostFixture: ComponentFixture<PaginationHostComponent>;
  let component: PaginationComponent;
  let host: PaginationHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaginationHostComponent],
    });
    hostFixture = TestBed.createComponent(PaginationHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
    component = hostFixture.debugElement.query(
      By.directive(PaginationComponent),
    )!.componentInstance;
  });

  const configure = (page: number, pageCount: number) => {
    host.page = page;
    host.pageCount = pageCount;
    hostFixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    hostFixture.detectChanges();
  };

  it('emits an increased page when next is allowed', () => {
    configure(1, 3);
    const emitted: number[] = [];
    component.pageChange.subscribe((value) => emitted.push(value));

    component.next();
    expect(emitted).toEqual([2]);
  });

  it('does not emit when already at the limits', () => {
    configure(1, 1);
    const emitted: number[] = [];
    component.pageChange.subscribe((value) => emitted.push(value));

    component.prev();
    component.next();
    expect(emitted).toEqual([]);
  });

  it('caps values when the page is outside the configured range', () => {
    configure(5, 4);
    const emitted: number[] = [];
    component.pageChange.subscribe((value) => emitted.push(value));

    component.next();
    component.prev();
    expect(emitted).toEqual([4]);
  });
});
