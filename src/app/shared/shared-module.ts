import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';

import { SearchBarComponent } from './components/search-bar/search-bar.component';

const modules = [CommonModule, FormsModule, ReactiveFormsModule, RouterOutlet, RouterModule];

@NgModule({
  declarations: [],
  imports: [...modules, SearchBarComponent],
  exports: [...modules, SearchBarComponent]
})
export class SharedModule { }
