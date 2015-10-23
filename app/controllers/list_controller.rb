class ListController < ApplicationController
  def index
    render json: CategoryCollection.new(holdingPath).raw
  end

  def category
    path = categoryPath(params)
    if !Dir.exists? path
      render status: 404, json: { error: "Category not found" }
    else
      render json: Category.new(path).raw
    end
  end
end
