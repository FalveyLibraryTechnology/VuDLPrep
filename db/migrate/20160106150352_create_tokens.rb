class CreateTokens < ActiveRecord::Migration
  def change
    create_table :tokens do |t|
      t.string :token
      t.datetime :expiration

      t.timestamps null: false
    end
  end
end
