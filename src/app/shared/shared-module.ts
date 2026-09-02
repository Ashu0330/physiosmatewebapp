import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';

const modules = [CommonModule, FormsModule, ReactiveFormsModule, RouterOutlet, RouterModule];

@NgModule({
  declarations: [],
  imports: [modules],
  exports: [modules]
})
export class SharedModule { }
