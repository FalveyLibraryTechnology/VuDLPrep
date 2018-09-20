class OcrController < ApplicationController
  before_action :validate_token_in_auth_header

  def ocr
    Resque.enqueue(OcrGenerator, params)
    render json: { status: 'ok' }
  end
end