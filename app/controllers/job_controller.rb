class JobController < ApplicationController
  def index
    render json: CategoryCollection.new(holdingPath).raw
  end
end
