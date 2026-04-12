import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Render,
  Res,
  Sse,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import type { Response } from 'express'
import { Observable } from 'rxjs'
import { RecipesCollectionEventsService } from '../recipes-events/recipes-collection-events.service'
import type { RecipesMvcFormDto } from './dto/recipes-mvc-form.dto'
import { RecipesMvcService } from './recipes-mvc.service'

const formPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: false,
})

@Controller('view/recipes')
export class RecipesMvcController {
  constructor(
    private readonly mvc: RecipesMvcService,
    private readonly recipeEvents: RecipesCollectionEventsService,
  ) {}

  @Get()
  @Render('recipes-index')
  async index() {
    const [recipes, mvcUserId] = await Promise.all([this.mvc.listRows(), this.mvc.getMvcActorUserId()])
    return { title: 'Рецепты (MVC)', recipes, mvcUserId }
  }

  @Get('add')
  @Render('recipes-form')
  addForm() {
    return {
      title: 'Новый рецепт',
      action: '/view/recipes',
      method: 'post',
      recipe: {
        title: '',
        cookingTime: 30,
        difficulty: 'easy',
        cuisine: '',
        ingredientName: '',
        instructions: '',
        coverImage: '',
      },
      submitLabel: 'Создать',
    }
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.recipeEvents.sseStream()
  }

  @Get(':id/edit')
  @Render('recipes-form')
  async editForm(@Param('id') id: string) {
    await this.mvc.assertCanEdit(id)
    const recipe = await this.mvc.getRecipeForForm(id)
    return {
      title: 'Редактирование',
      action: `/view/recipes/${id}/update`,
      method: 'post',
      submitLabel: 'Сохранить',
      recipe,
    }
  }

  @Get(':id')
  @Render('recipes-detail')
  async detail(@Param('id') id: string) {
    const row = await this.mvc.findRow(id)
    if (!row) {
      return { title: 'Не найдено', error: 'Рецепт не найден', recipe: null as unknown, mvcUserId: '' }
    }
    const mvcUserId = await this.mvc.getMvcActorUserId()
    return { title: row.title, recipe: row, mvcUserId }
  }

  @Post()
  @UsePipes(formPipe)
  async create(@Body() dto: RecipesMvcFormDto, @Res() res: Response) {
    const id = await this.mvc.createRecipe(dto)
    return res.redirect(303, `/view/recipes/${id}`)
  }

  @Post(':id/update')
  @UsePipes(formPipe)
  async update(@Param('id') id: string, @Body() dto: RecipesMvcFormDto, @Res() res: Response) {
    await this.mvc.assertCanEdit(id)
    await this.mvc.updateRecipe(id, dto)
    return res.redirect(303, `/view/recipes/${id}`)
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.mvc.assertCanEdit(id)
    await this.mvc.deleteRecipe(id)
    return res.redirect(303, '/view/recipes')
  }
}
